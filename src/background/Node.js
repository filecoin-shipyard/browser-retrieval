/* global chrome */

import PeerId from 'peer-id';
import Libp2p from 'libp2p';
import Websockets from 'libp2p-websockets';
import WebrtcStar from 'libp2p-webrtc-star';
import Mplex from 'libp2p-mplex';
import { NOISE } from 'libp2p-noise';
import Secio from 'libp2p-secio';
import Gossipsub from 'libp2p-gossipsub';
import topics from 'src/shared/topics';
import messageTypes from 'src/shared/messageTypes';
import getOptions from 'src/shared/getOptions';
import formatPrice from 'src/shared/formatPrice';
import ports from './ports';
import Datastore from './Datastore';
import setOptions from 'src/shared/setOptions';

class Node {
  static async create(options) {
    const node = new Node();
    await node.initialize(options);
    return node;
  }

  connectedPeers = new Set();
  queriedCids = new Set();

  async initialize({ rendezvousIp, rendezvousPort, wallet }) {
    // TODO: save wallet to options
    const rendezvousProtocol = /^\d+\.\d+\.\d+\.\d+$/.test(rendezvousIp) ? 'ip4' : 'dns4';
    const rendezvousWsProtocol = `${rendezvousPort}` === '443' ? 'wss' : 'ws';
    const rendezvousAddress = `/${rendezvousProtocol}/${rendezvousIp}/tcp/${rendezvousPort}/${rendezvousWsProtocol}/p2p-webrtc-star`;

    ports.postLog('DEBUG: creating peer id');
    this.peerId = await PeerId.create();
    this.id = this.peerId.toB58String();

    ports.postLog('DEBUG: creating libp2p node');
    this.node = await Libp2p.create({
      peerId: this.peerId,
      modules: {
        transport: [Websockets, WebrtcStar],
        streamMuxer: [Mplex],
        connEncryption: [NOISE, Secio],
        pubsub: Gossipsub,
      },
      addresses: {
        listen: [rendezvousAddress],
      },
    });

    ports.postLog('DEBUG: creating datastore');
    this.datastore = new Datastore('/blocks', { prefix: 'filecoin-retrieval', version: 1 });
    await this.datastore.open();

    ports.postLog('DEBUG: starting libp2p node');
    await this.node.start();

    ports.postLog('DEBUG: adding listeners to node');
    this.node.connectionManager.on('peer:connect', this.handlePeerConnect);
    this.node.connectionManager.on('peer:disconnect', this.handlePeerDisconnect);
    this.node.pubsub.subscribe(topics.filecoinRetrieval, this.handleMessage);

    ports.postLog('DEBUG: getting node info');
    this.getInfo();

    ports.postLog('DEBUG: node created');
  }

  async getInfo() {
    this.multiaddrs = this.node.multiaddrs.map(
      multiaddr => `${multiaddr.toString()}/p2p/${this.id}`,
    );
    this.postMultiaddrs();
  }

  handlePeerConnect = connection => {
    this.connectedPeers.add(connection.remotePeer.toB58String());
    this.postPeers();
  };

  handlePeerDisconnect = connection => {
    this.connectedPeers.delete(connection.remotePeer.toB58String());
    this.postPeers();
  };

  handleMessage = ({ from, data }) => {
    if (from === this.id) {
      return;
    }

    const string = data.toString();
    ports.postLog(`DEBUG: received message ${string}`);
    const message = JSON.parse(string);

    switch (message.messageType) {
      case messageTypes.query:
        this.handleQuery(message);
        break;

      case messageTypes.queryResponse:
        this.handleQueryResponse(message);
        break;

      default:
        break;
    }
  };

  async handleQuery({ cid }) {
    try {
      const { pricesPerByte, knownCids } = await getOptions();
      const cidInfo = knownCids[cid];

      if (cidInfo) {
        ports.postLog(`INFO: someone queried for a CID I have: ${cid}`);
        const pricePerByte = pricesPerByte[cid] || pricesPerByte['*'];

        await this.publish({
          messageType: messageTypes.queryResponse,
          cid,
          size: cidInfo.size,
          multiaddrs: this.multiaddrs,
          params: {
            pricePerByte,
            // TODO: paymentInterval, paymentIntervalIncrease
          },
        });
      }
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: handle query failed: ${error.message}`);
    }
  }

  async handleQueryResponse({ cid, multiaddrs: [multiaddr], size, params }) {
    if (this.queriedCids.has(cid)) {
      try {
        this.queriedCids.delete(cid);
        ports.postLog(`INFO: this peer has the CID I asked for: ${multiaddr}`);
        ports.postLog(`INFO: size: ${size}, price per byte: ${formatPrice(params.pricePerByte)}`);

        // TODO: implement custom protocol per https://docs.google.com/document/d/1ye0C7_kdnDCfcV8KsQCRafCDvrjRkiilqW9NlXF3M7Q/edit#
      } catch (error) {
        console.error(error);
        ports.postLog(`ERROR: handle query response failed: ${error.message}`);
      }
    }
  }

  async query(cid) {
    try {
      this.queriedCids.add(cid);
      ports.postLog(`INFO: querying for ${cid}`);
      await this.publish({ messageType: messageTypes.query, cid });
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: publish to topic failed: ${error.message}`);
    }
  }

  async uploadFiles(files) {
    try {
      ports.postLog(`DEBUG: uploading ${files.length} files`);
      const { knownCids } = await getOptions();

      await Promise.all(
        files.map(async file => {
          const size = file.size;
          const cid = await this.datastore.put(file);
          knownCids[cid] = { size };
          setOptions({ knownCids });
        }),
      );

      ports.postLog(`DEBUG: ${files.length} files uploaded`);
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: upload failed: ${error.message}`);
    }
  }

  async downloadFile(cid) {
    try {
      ports.postLog(`DEBUG: downloading ${cid}`);
      const url = await this.datastore.get(cid);
      chrome.downloads.download({ url, filename: cid, saveAs: true });
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: download failed: ${error.message}`);
    }
  }

  async deleteFile(cid) {
    try {
      ports.postLog(`DEBUG: deleting ${cid}`);
      const [{ knownCids }] = await Promise.all([getOptions(), this.datastore.delete(cid)]);
      delete knownCids[cid];
      setOptions({ knownCids });
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: delete failed: ${error.message}`);
    }
  }

  async publish(message) {
    const string = JSON.stringify(message);
    ports.postLog(`DEBUG: publishing message ${string}`);
    await this.node.pubsub.publish(topics.filecoinRetrieval, string);
  }

  postMultiaddrs() {
    ports.postMultiaddrs(this.multiaddrs);
  }

  postPeers() {
    ports.postPeers(Array.from(this.connectedPeers));
  }

  async stop() {
    ports.postLog('DEBUG: stopping ipfs node');
    ports.postMultiaddrs();
    ports.postPeers();
    await this.datastore.close();
    await this.ipfs.stop();
  }
}

export default Node;
