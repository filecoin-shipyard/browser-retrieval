/* global chrome */

import IPFS from 'ipfs';
import all from 'it-all';
import last from 'it-last';
import topics from 'src/shared/topics';
import messageTypes from 'src/shared/messageTypes';
import getOptions from 'src/shared/getOptions';
import formatPrice from 'src/shared/formatPrice';
import ports from './ports';
import streamFromFile from './streamFromFile';

class Node {
  static async create(options) {
    const node = new Node();
    await node.initialize(options);
    return node;
  }

  pins = new Set();
  queriedCids = new Set();

  async initialize({ rendezvousIp, rendezvousPort }) {
    const rendezvousProtocol = /^\d+\.\d+\.\d+\.\d+$/.test(rendezvousIp) ? 'ip4' : 'dns4';
    const rendezvousWsProtocol = `${rendezvousPort}` === '443' ? 'wss' : 'ws';
    const rendezvousAddress = `/${rendezvousProtocol}/${rendezvousIp}/tcp/${rendezvousPort}/${rendezvousWsProtocol}/p2p-webrtc-star`;

    ports.postLog('DEBUG: creating ipfs node');
    this.ipfs = await IPFS.create({
      // add random part to workaround this issue: https://github.com/ipfs/js-ipfs/issues/3157
      repo: 'ipfs-filecoinretrieval-' + Math.random(),
      config: {
        Addresses: {
          Swarm: [rendezvousAddress],
        },
        // If you want to connect to the public bootstrap nodes, remove the next line
        Bootstrap: [],
      },
    });

    ports.postLog('DEBUG: getting node info');
    await this.getInfo();
    ports.postLog('DEBUG: subscribing to pubsub');
    await this.subscribe();
    this.postMultiaddrs();
    this.postPins();
    this.postPeersInterval = setInterval(this.postPeers, 3000);
    ports.postLog('DEBUG: peer created');
  }

  async getInfo() {
    const info = await this.ipfs.id();
    this.id = info.id.toString();
    this.multiaddrs = info.addresses.map(address => address.toString());
  }

  async subscribe() {
    await this.ipfs.pubsub.subscribe(topics.filecoinRetrieval, this.handleMessage);
  }

  async publish(message) {
    const string = JSON.stringify(message);
    ports.postLog(`DEBUG: publishing message ${string}`);
    const buffer = IPFS.Buffer.from(string);
    await this.ipfs.pubsub.publish(topics.filecoinRetrieval, buffer);
  }

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
    if (this.pins.has(cid)) {
      try {
        ports.postLog(`INFO: someone queried for a CID I have: ${cid}`);
        const [{ pricesPerByte }, { size }] = await Promise.all([
          getOptions(),
          last(this.ipfs.ls(cid)),
        ]);
        const pricePerByte = pricesPerByte[cid] || pricesPerByte['*'];

        await this.publish({
          messageType: messageTypes.queryResponse,
          cid,
          multiaddrs: this.multiaddrs,
          size,
          pricePerByte,
          total: size * pricePerByte,
          // TODO: paymentInterval, miner, minerPeerId
        });
      } catch (error) {
        console.error(error);
        ports.postLog(`ERROR: handle query failed: ${error.message}`);
      }
    }
  }

  async handleQueryResponse({ cid, multiaddrs: [multiaddr], size, pricePerByte, total }) {
    if (this.queriedCids.has(cid)) {
      try {
        this.queriedCids.delete(cid);
        ports.postLog(`INFO: this peer has the CID I asked for: ${multiaddr}`);
        ports.postLog(
          `INFO: size: ${size}, price per byte: ${formatPrice(pricePerByte)}, total: ${formatPrice(
            total,
          )}`,
        );

        // TODO: implement custom protocol per https://docs.google.com/document/d/1ye0C7_kdnDCfcV8KsQCRafCDvrjRkiilqW9NlXF3M7Q/edit#
        await this.ipfs.pin.add(cid);
        this.pins.add(cid);
        this.postPins();
        ports.postLog(`INFO: received ${cid}`);
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

      for (const file of files) {
        const size = file.size;

        const fileAdded = await last(
          this.ipfs.add(
            {
              path: file.name,
              content: streamFromFile(file),
            },
            {
              pin: true,
              wrapWithDirectory: true,
              progress: bytesLoaded => ports.postProgress(bytesLoaded / size),
            },
          ),
        );

        await this.pins.add(fileAdded.cid.toString());
        this.postPins();
        ports.postProgress(0);
      }

      ports.postLog(`DEBUG: ${files.length} files uploaded`);
    } catch (error) {
      ports.postLog(`ERROR: upload failed: ${error.message}`);
    }
  }

  async downloadFile(cid) {
    try {
      ports.postLog(`DEBUG: downloading ${cid}`);

      for await (const file of this.ipfs.get(cid)) {
        if (file.content) {
          const data = IPFS.Buffer.concat(await all(file.content));
          const blob = new Blob([data], { type: 'application/octet-binary' });
          const url = URL.createObjectURL(blob);
          chrome.downloads.download({ url, filename: cid, saveAs: true });
        }
      }
    } catch (error) {
      ports.postLog(`ERROR: download failed: ${error.message}`);
    }
  }

  async deleteFile(cid) {
    try {
      ports.postLog(`DEBUG: unpinning ${cid}`);
      await this.ipfs.pin.rm(cid);
      this.pins.delete(cid);
      this.postPins();
    } catch (error) {
      ports.postLog(`ERROR: delete failed: ${error.message}`);
    }
  }

  postMultiaddrs() {
    ports.postMultiaddrs(this.multiaddrs);
  }

  postPins() {
    ports.postPins(Array.from(this.pins));
  }

  postPeers = async () => {
    try {
      const peers = await this.ipfs.swarm.peers();
      const peersAddr = peers
        .reverse()
        .filter(({ addr }) => addr)
        .map(peer => {
          const addr = peer.addr.toString();
          return addr.includes('/p2p/') ? addr : `${addr}${peer.peer}`;
        });
      ports.postPeers(peersAddr);
    } catch (error) {
      console.error(error);
      ports.postLog(`ERROR: post peer list failed: ${error.message}`);
    }
  };

  async stop() {
    ports.postLog('DEBUG: stopping ipfs node');
    clearInterval(this.postPeersInterval);
    ports.postMultiaddrs();
    ports.postPeers();
    await this.ipfs.stop();
  }
}

export default Node;
