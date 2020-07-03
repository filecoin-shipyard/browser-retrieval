import PeerId from 'peer-id';
import Libp2p from 'libp2p';
import Websockets from 'libp2p-websockets';
import WebrtcStar from 'libp2p-webrtc-star';
import Mplex from 'libp2p-mplex';
import { NOISE } from 'libp2p-noise';
import Secio from 'libp2p-secio';
import Gossipsub from 'libp2p-gossipsub';
import protocols from 'src/shared/protocols';
import topics from 'src/shared/topics';
import messageTypes from 'src/shared/messageTypes';
import ports from './ports';
import pipe from 'it-pipe';

const fakeKnownCids = [
  'bafkki48dk2001mcdqblhp6k6k3lhk0s00saa6d3jk2lkvipqf9dd00dlck',
  'bafkreidj7dy2i5tnckivxbrdp6ija2m6lwcc6ivuttuxexezkfwgyorx7e',
];

const fakeData =
  '...fake data......fake data......fake data......fake data......fake data......fake data......fake data...';

class Peer {
  constructor(options) {
    this.options = options;
    this.connectedPeers = new Set();
    this.queriedCids = new Set();
  }

  async start() {
    await this.initialize();
    await this.listen();
  }

  async initialize() {
    const { rendezvousIp, rendezvousPort } = this.options;
    const rendezvousProtocol = /^\d+\.\d+\.\d+\.\d+$/.test(rendezvousIp) ? 'ip4' : 'dns';
    const rendezvousWsProtocol = `${rendezvousPort}` === '443' ? 'wss' : 'ws';

    this.peerId = await PeerId.create();

    this.libp2p = await Libp2p.create({
      peerId: this.peerId,
      modules: {
        transport: [Websockets, WebrtcStar],
        streamMuxer: [Mplex],
        connEncryption: [NOISE, Secio],
        pubsub: Gossipsub,
      },
      addresses: {
        listen: [
          `/${rendezvousProtocol}/${rendezvousIp}/tcp/${rendezvousPort}/${rendezvousWsProtocol}/p2p-webrtc-star`,
        ],
      },
    });
  }

  async listen() {
    this.libp2p.connectionManager.on('peer:connect', this.handlePeerConnect);
    this.libp2p.connectionManager.on('peer:disconnect', this.handlePeerDisconnect);
    this.libp2p.handle(protocols.filecoinRetrieval, this.handleFilecoinRetrievalProcotol);
    await this.libp2p.start();
    this.multiaddrs = this.libp2p.multiaddrs.map(
      ma => ma.toString() + '/p2p/' + this.peerId.toB58String(),
    );
    this.libp2p.pubsub.subscribe(topics.filecoinRetrieval, this.handleFilecoinRetrievalTopic);
    ports.postMultiaddrs(this.multiaddrs);
    ports.postPeers(this.connectedPeers);
  }

  handlePeerConnect = connection => {
    this.connectedPeers.add(connection.remotePeer.toB58String());
    ports.postPeers(this.connectedPeers);
  };

  handlePeerDisconnect = connection => {
    this.connectedPeers.delete(connection.remotePeer.toB58String());
    ports.postPeers(this.connectedPeers);
  };

  handleFilecoinRetrievalProcotol = async ({ connection, stream }) => {
    // TODO:  implement custom protocol per https://docs.google.com/document/d/1ye0C7_kdnDCfcV8KsQCRafCDvrjRkiilqW9NlXF3M7Q/edit#
    try {
      await pipe(stream, async function (source) {
        for await (const message of source) {
          ports.postLog(`INFO: received: ${String(message)}`);
        }
      });

      await pipe([fakeData], stream.sink);
    } catch (error) {
      ports.postLog(`ERROR: ${error.message}`);
    }
  };

  handleFilecoinRetrievalTopic = async ({ data }) => {
    const message = data.toString('utf8', 0, data.length);

    try {
      const messageObject = JSON.parse(message);

      switch (messageObject.messageType) {
        case messageTypes.query:
          this.handleQuery(messageObject);
          break;

        case messageTypes.queryResponse:
          this.handleQueryResponse(messageObject);
          break;

        default:
          break;
      }
    } catch (error) {
      ports.postLog(`ERROR: ${error.message}`);
    }
  };

  handleQuery({ cid }) {
    if (fakeKnownCids.includes(cid)) {
      ports.postLog(`INFO: someone queried a cid I have: ${cid}`);
      this.publish({
        messageType: messageTypes.queryResponse,
        cid,
        multiaddrs: this.multiaddrs,
        // TODO: pricePerByte, size, total, paymentInterval, miner, minerPeerId
      });
    }
  }

  async handleQueryResponse({ cid, multiaddrs: [multiaddr] }) {
    if (this.queriedCids.has(cid)) {
      // TODO: only because all peers have the same cids
      if (multiaddr === this.multiaddrs[0]) {
        return;
      }

      this.queriedCids.delete(cid);
      ports.postLog(`INFO: someone has the cid I asked for: ${multiaddr}`);
      const { stream } = await this.libp2p.dialProtocol(multiaddr, protocols.filecoinRetrieval);
      ports.postLog(`INFO: dialed with protocol ${protocols.filecoinRetrieval}`);

      // TODO:  implement custom protocol per https://docs.google.com/document/d/1ye0C7_kdnDCfcV8KsQCRafCDvrjRkiilqW9NlXF3M7Q/edit#

      pipe(['payment voucher 1... payment voucher 2...'], stream, async function (source) {
        for await (const data of source) {
          ports.postLog(`INFO: received: ${data.toString()}`);
        }
      });
    }
  }

  publish(messageObject) {
    this.libp2p.pubsub.publish(topics.filecoinRetrieval, JSON.stringify(messageObject));
  }

  query(cid) {
    this.queriedCids.add(cid);
    ports.postLog(`INFO: querying: ${cid}`);
    this.publish({ messageType: messageTypes.query, cid });
  }

  stop() {
    return this.libp2p.stop();
  }
}

export default Peer;
