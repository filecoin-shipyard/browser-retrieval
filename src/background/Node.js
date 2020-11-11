/* global chrome */
import inspect from 'browser-util-inspect';
import Libp2p from 'libp2p';
import Gossipsub from 'libp2p-gossipsub';
import Mplex from 'libp2p-mplex';
import { NOISE } from 'libp2p-noise';
import Secio from 'libp2p-secio';
import WebrtcStar from 'libp2p-webrtc-star';
import Websockets from 'libp2p-websockets';
import PeerId from 'peer-id';
import { hasOngoingDeals } from 'src/background/ongoingDeals';
import { decodeCID } from 'src/shared/decodeCID';
import getOptions from 'src/shared/getOptions';
import messageTypes from 'src/shared/messageTypes';
import { clearOffers } from 'src/shared/offers';
import setOptions from 'src/shared/setOptions';
import topics from 'src/shared/topics';

import Datastore from './Datastore';
import Lotus from './lotus-client/Lotus';
import ports from './ports';
import Client from './retrieval-market/Client';
import Provider from './retrieval-market/Provider';
import SocketClient from './socket-client/SocketClient';

class Node {
  static async create(options) {
    const node = new Node();
    await node.initialize(options);
    return node;
  }

  //Run every 10 minutes
  automationLoopTime = 600000;
  lastIntervalId = 0;

  connectedPeers = new Set();
  queriedCids = new Set();

  node;

  /** @type {Client} Retrieval market client */
  client;

  /** @type {SocketClient} */
  socketClient;

  async initialize({ rendezvousIp, rendezvousPort, wallet }) {
    const options = await getOptions();

    const rendezvousProtocol = /^\d+\.\d+\.\d+\.\d+$/.test(rendezvousIp) ? 'ip4' : 'dns4';
    const rendezvousWsProtocol = `${rendezvousPort}` === '443' ? 'wss' : 'ws';
    const rendezvousAddress = `/${rendezvousProtocol}/${rendezvousIp}/tcp/${rendezvousPort}/${rendezvousWsProtocol}/p2p-webrtc-star`;

    ports.postLog('DEBUG: Node.initialize(): creating peer id');
    this.peerId = await PeerId.create();
    this.id = this.peerId.toB58String();
    ports.postLog(`DEBUG: Node.initialize(): our peer id is ${this.id}`);

    ports.postLog('DEBUG: Node.initialize(): creating libp2p node');
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

    ports.postLog('DEBUG: Node.initialize(): creating lotus client');
    this.lotus = await Lotus.create();

    ports.postLog('DEBUG: Node.initialize(): creating datastore');
    this.datastore = await Datastore.create('/blocks', {
      prefix: 'filecoin-retrieval',
      version: 1,
    });

    ports.postLog('DEBUG: creating retrieval market client');
    // retrieval-market client
    this.client = await Client.create(this.node, this.datastore, this.lotus, this.handleCidReceived);

    ports.postLog('DEBUG: Node.initialize(): creating Provider.js (retrieval market provider)');
    this.provider = await Provider.create(this.node, this.datastore, this.lotus);

    ports.postLog(`DEBUG: Node.initialize(): creating SocketClient.js (Socket connection)`);
    this.socketClient = SocketClient.create({ datastore: this.datastore }, options, {
      handleCidReceived: (...args) => {
        if (!hasOngoingDeals()) {
          this.socketClient.disconnect();
        }
        return this.handleCidReceived(...args);
      },
    });

    ports.postLog('DEBUG: Node.initialize(): starting libp2p node');
    await this.node.start();

    ports.postLog('DEBUG: Node.initialize(): adding listeners to node');
    this.node.connectionManager.on('peer:connect', this.handlePeerConnect);
    this.node.connectionManager.on('peer:disconnect', this.handlePeerDisconnect);
    this.node.pubsub.subscribe(topics.filecoinRetrieval, this.handleMessage);

    ports.postLog('DEBUG: Node.initialize(): getting node info');
    this.getInfo();

    ports.postLog('DEBUG: Node.initialize(): node created');
  }

  async getInfo() {
    this.multiaddrs = this.node.multiaddrs.map((multiaddr) => `${multiaddr.toString()}/p2p/${this.id}`);
    this.postMultiaddrs();
  }

  handlePeerConnect = (connection) => {
    this.connectedPeers.add(connection.remotePeer.toB58String());
    this.postPeers();
  };

  handlePeerDisconnect = (connection) => {
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
        ports.postLog(`INFO: someone queried node`);
        this.handleQuery(message);
        break;

      case messageTypes.queryResponse:
        ports.postLog(`INFO: handleMessage > queryResponse`);
        this.handleQueryResponse(message);
        break;

      default:
        break;
    }
  };

  async handleQuery({ cid }) {
    try {
      const params = await this.provider.getDealParams(cid);

      if (params) {
        ports.postLog(`INFO: someone queried for a CID I have: ${cid}`);
        await this.publish({
          messageType: messageTypes.queryResponse,
          cid,
          multiaddrs: this.multiaddrs,
          params,
        });
      }
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: handle query failed: ${error.message}`);
    }
  }

  async handleQueryResponse({ messageType, cid, multiaddrs, params }) {
    if (!this.queriedCids.has(cid)) {
      return;
    }

    const decoded = decodeCID(cid);

    if (decoded.format !== 'raw') {
      ports.alertError(`CIDs >2MB not yet supported`);
      ports.postLog(`DEBUG: CIDs >2MB not yet supported. Format not supported: ${decoded.format}`);
      return;
    }

    const options = await getOptions();
    const offers = options.offerInfo?.offers || [];

    await setOptions({
      ...options,
      offerInfo: {
        cid,
        offers: offers.concat(
          multiaddrs.map((address) => ({
            address,
            price: params.size * params.pricePerByte,
            params,
          })),
        ),
      },
    });
  }

  handleCidReceived = async (cid, size) => {
    try {
      ports.postLog(`INFO: CID received: ${cid}`);
      const { knownCids } = await getOptions();
      knownCids[cid] = { size };
      await setOptions({ knownCids });
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: save received cid failed: ${error.message}`);
    }
  };

  async query(rawCid, minerID) {
    try {
      await this.clearOffers();

      const cid = rawCid.trim();
      this.queriedCids.add(cid);

      clearOffers();

      if (minerID) {
        ports.postLog(`INFO: querying proxy for ${cid} , minerID:  ${minerID}`);
        this.socketClient.connect();
        this.socketClient.query({ cid, minerID });
      }

      ports.postLog(`INFO: querying peers for ${cid}`);
      await this.publish({ messageType: messageTypes.query, cid });
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: publish to topic failed: ${error.message}`);
    }
  }

  async clearOffers() {
    const options = await getOptions();

    if (options.offerInfo.cid) {
      this.queriedCids.delete(options.offerInfo.cid);
    }

    await setOptions({
      ...options,
      offerInfo: {
        cid: undefined,
        offers: [],
        params: undefined,
      },
    });
  }

  runInLoop(stop = false) {
    if (stop) {
      return clearInterval(this.lastIntervalId);
    }

    return setInterval(async () => {
      const { automationCode } = await getOptions();

      try {
        // eslint-disable-next-line no-eval
        eval(automationCode);
      } catch (error) {
        ports.postLog(`ERROR: automation loop failed: ${error.message}`);
      }
    }, this.automationLoopTime);
  }

  stopLoop() {
    return clearInterval(this.lastIntervalId);
  }

  async runAutomationCode() {
    try {
      const { automationCode } = await getOptions();
      ports.postLog(`INFO: automation code saved`);

      // eslint-disable-next-line no-eval
      eval(automationCode);
      this.lastIntervalId = this.runInLoop();
    } catch (error) {
      ports.postLog(`ERROR: automation code failed: ${error.message}`);
      this.runInLoop(true);
    }
  }

  async updatePrice(cid, price) {
    ports.postLog(`INFO: update price: ${price} for cid: ${cid}`);
    const { pricesPerByte } = await getOptions();

    return await setOptions({
      pricesPerByte: {
        ...pricesPerByte,
        [cid]: parseInt(price, 10),
      },
    });
  }

  async uploadFiles(files) {
    try {
      ports.postLog(`DEBUG: Node.uploadFiles(): uploading ${files.length} files`);
      const { knownCids } = await getOptions();

      const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
      let totalBytesLoaded = 0;

      await Promise.all(
        files.map(async (file) => {
          const { cid, size } = await this.datastore.putFile(file, {
            progress: (bytesLoaded) => {
              totalBytesLoaded += bytesLoaded;
              ports.postUploadProgress(totalBytesLoaded / totalBytes);
            },
          });
          knownCids[cid] = { size };
          setOptions({ knownCids });
        }),
      );

      ports.postUploadProgress(0);
      ports.postLog(`DEBUG: Node.uploadFiles(): ${files.length} files uploaded`);
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: Node.uploadFiles(): upload failed: ${error.message}`);
    }
  }

  async _downloadFromPeer({ cid, offer }) {
    ports.postLog(`DEBUG:  Node._downloadFromPeer: starting`);

    if (!this.queriedCids.has(cid)) {
      ports.postLog(`DEBUG:  Node._downloadFromPeer: exiting because Node.queriedCids does not contain '${cid}'`);
      return;
    }

    ports.postLog(`DEBUG:  Node._downloadFromPeer:  offer=${JSON.stringify(offer)}`);
    ports.postLog(
      `DEBUG:  Node._downloadFromPeer:\n  CID: ${cid}\n  from: ${offer.address}\n  price: ${offer.price} attoFil`,
    );

    const { params } = offer;
    const multiaddr = offer.address;

    const downloadParams = { cid, params, multiaddr };
    if (/^ws/i.test(multiaddr)) {
      return this.retrieveFromSocket(downloadParams);
    }

    return this.retrieveFromPeer(downloadParams);
  }

  async retrieveFromSocket({ cid, params, multiaddr }) {
    try {
      await this.socketClient.buy({ cid, params, multiaddr });
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: Node.retrieveFromSocket():  failed: ${error.message}`);
    }
  }

  async retrieveFromPeer({ cid, params, multiaddr }) {
    try {
      await this.client.retrieve(cid, params, multiaddr); // TODO:  peer wallet!
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: Node.retrieveFromPeer():  failed: ${error.message}`);
    }
  }

  async _downloadLocally({ cid }) {
    try {
      ports.postLog(`DEBUG: Node._downloadLocally(): downloading ${cid}`);
      const data = await this.datastore.cat(cid);
      const response = await fetch(`data:application/octet-stream;base64,${data.toString('base64')}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const downloadId = await chrome.downloads.download({ url, filename: cid, saveAs: true });

      function handleDownloadChanged(delta) {
        if (delta.state && delta.state.current === 'complete' && delta.id === downloadId) {
          ports.postLog(
            `DEBUG: Node._downloadLocally.handleDownloadChanged():  download completed, revoking object url ${cid}`,
          );
          URL.revokeObjectURL(url);
          chrome.downloads.onChanged.removeListener(handleDownloadChanged);
        }
      }

      chrome.downloads.onChanged.addListener(handleDownloadChanged);
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR:  Node._downloadLocally():  download failed: ${error.message}`);
      ports.alertError(`Download failed: ${error.message}`);
    }
  }

  async downloadFile({ cid, offer }) {
    ports.postLog(`DEBUG:  Node.downloadFile:\n  cid:'${cid}'\n  offer=${inspect(offer)}`);
    try {
      if (offer) {
        this._downloadFromPeer({ cid, offer });
      } else {
        this._downloadLocally({ cid });
      }
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: Node.downloadFile(): error: ${error.message}`);
    }
  }

  async deleteFile(cid) {
    try {
      ports.postLog(`DEBUG: Node.deleteFile(): deleting ${cid}`);
      const [{ knownCids }] = await Promise.all([getOptions(), this.datastore.delete(cid)]);
      delete knownCids[cid];
      setOptions({ knownCids });
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: Node.deleteFile(): delete failed: ${error.message}`);
    }
  }

  /**
   * Sends a message to other peers in the network asking for a CID
   * @param  {} message Contains `cid` that the node is looking for
   */
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
    await this.node.stop();
  }
}

export default Node;
