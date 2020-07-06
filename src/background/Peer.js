import PeerId from 'peer-id';
import Libp2p from 'libp2p';
import Websockets from 'libp2p-websockets';
import WebrtcStar from 'libp2p-webrtc-star';
import Mplex from 'libp2p-mplex';
import { NOISE } from 'libp2p-noise';
import Secio from 'libp2p-secio';
import Gossipsub from 'libp2p-gossipsub';
import pipe from 'it-pipe';
import protocols from 'src/shared/protocols';
import topics from 'src/shared/topics';
import messageTypes from 'src/shared/messageTypes';
import getOptions from 'src/shared/getOptions';
import getData from 'src/shared/getData';
import setData from 'src/shared/setData';
import ports from './ports';

class Peer {
  constructor({ rendezvousIp, rendezvousPort }) {
    this.rendezvousIp = rendezvousIp;
    this.rendezvousPort = rendezvousPort;
    this.connectedPeers = new Set();
    this.queriedCids = new Set();
  }

  async start() {
    await this.initialize();
    await this.listen();
  }

  async initialize() {
    const rendezvousProtocol = /^\d+\.\d+\.\d+\.\d+$/.test(this.rendezvousIp) ? 'ip4' : 'dns';
    const rendezvousWsProtocol = `${this.rendezvousPort}` === '443' ? 'wss' : 'ws';

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
          `/${rendezvousProtocol}/${this.rendezvousIp}/tcp/${this.rendezvousPort}/${rendezvousWsProtocol}/p2p-webrtc-star`,
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
          const cid = String(message);
          ports.postLog(`INFO: sending ${cid}`);
          await pipe([getData(cid)], stream.sink);
        }
      });
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
          await this.handleQuery(messageObject);
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

  async handleQuery({ cid }) {
    const { knownCids } = await getOptions();

    if (knownCids.includes(cid)) {
      ports.postLog(`INFO: someone queried for a CID I have: ${cid}`);
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
      this.queriedCids.delete(cid);
      ports.postLog(`INFO: this peer has the CID I asked for: ${multiaddr}`);
      const { stream } = await this.libp2p.dialProtocol(multiaddr, protocols.filecoinRetrieval);

      // TODO: implement custom protocol per https://docs.google.com/document/d/1ye0C7_kdnDCfcV8KsQCRafCDvrjRkiilqW9NlXF3M7Q/edit#
      // TODO: setup some kind of requestId to prevent sending the cid again (user could ask for a cid different from initial query)
      pipe([cid], stream, async function (source) {
        for await (const data of source) {
          await setData(String(data));
          ports.postLog(`INFO: received ${cid}`);
        }
      });
    }
  }

  publish(messageObject) {
    this.libp2p.pubsub.publish(topics.filecoinRetrieval, JSON.stringify(messageObject));
  }

  query(cid) {
    this.queriedCids.add(cid);
    ports.postLog(`INFO: querying for ${cid}`);
    this.publish({ messageType: messageTypes.query, cid });
  }

  stop() {
    ports.postMultiaddrs();
    ports.postPeers();
    return this.libp2p.stop();
  }
}

export default Peer;
