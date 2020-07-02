/* global chrome */

import PeerId from 'peer-id';
import Libp2p from 'libp2p';
import Websockets from 'libp2p-websockets';
import WebrtcStar from 'libp2p-webrtc-star';
import Mplex from 'libp2p-mplex';
import { NOISE } from 'libp2p-noise';
import Secio from 'libp2p-secio';
import Gossipsub from 'libp2p-gossipsub';
import filecoinRetrieval from 'src/shared/filecoinRetrieval';
import ports from './ports';
import pipe from 'it-pipe';

const fakeKnownCids = [
  'bafkki48dk2001mcdqblhp6k6k3lhk0s00saa6d3jk2lkvipqf9dd00dlck',
  'bafkreidj7dy2i5tnckivxbrdp6ija2m6lwcc6ivuttuxexezkfwgyorx7e',
];

const fakeData =
  '...fake data......fake data......fake data......fake data......fake data......fake data......fake data...';

async function run(options) {
  const { rendezvousIp, rendezvousPort } = options;
  const rendezvousProtocol = /^\d+\.\d+\.\d+\.\d+$/.test(rendezvousIp) ? 'ip4' : 'dns';
  const rendezvousWsProtocol = `${rendezvousPort}` === '443' ? 'wss' : 'ws';

  const peerId = await PeerId.create();
  const connectedPeers = new Set();
  const queriedCids = new Set();

  const libp2p = await Libp2p.create({
    peerId,
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

  //
  // Log a message when we receive a connection
  //
  ports.postPeers(connectedPeers);
  libp2p.connectionManager.on('peer:connect', connection => {
    connectedPeers.add(connection.remotePeer.toB58String());
    ports.postPeers(connectedPeers);
  });
  libp2p.connectionManager.on('peer:disconnect', connection => {
    connectedPeers.delete(connection.remotePeer.toB58String());
    ports.postPeers(connectedPeers);
  });

  //
  // Stream handler for protocol
  //
  libp2p.handle(filecoinRetrieval.protocol, async ({ connection, stream }) => {
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
  });

  //
  // Start listening
  //
  ports.postListeningState();
  await libp2p.start();
  const multiaddrs = libp2p.multiaddrs.map(ma => ma.toString() + '/p2p/' + peerId.toB58String());
  ports.postListeningState(multiaddrs);

  function publish(messageObject) {
    libp2p.pubsub.publish(filecoinRetrieval.topic, JSON.stringify(messageObject));
  }

  //
  // Pubsub channel subscribe + message handling
  //
  libp2p.pubsub.subscribe(filecoinRetrieval.topic, async ({ data }) => {
    const message = data.toString('utf8', 0, data.length);

    try {
      const messageObject = JSON.parse(message);
      const { messageType, cid } = messageObject;

      switch (messageType) {
        case filecoinRetrieval.messageType.query:
          if (fakeKnownCids.includes(cid)) {
            ports.postLog(`INFO: someone queried a cid I have: ${cid}`);
            publish({
              messageType: filecoinRetrieval.messageType.queryResponse,
              cid,
              multiaddrs,
              // TODO
              // pricePerByte
              // size
              // total
              // paymentInterval
              // miner
              // minerPeerId
            });
          }
          break;

        case filecoinRetrieval.messageType.queryResponse:
          if (queriedCids.has(cid)) {
            // TODO: only because all peers have the same cids
            if (messageObject.multiaddrs[0] === multiaddrs[0]) {
              break;
            }

            queriedCids.delete(cid);
            ports.postLog(`INFO: someone has the cid I asked for: ${messageObject.multiaddrs[0]}`);
            const { stream } = await libp2p.dialProtocol(
              messageObject.multiaddrs[0],
              filecoinRetrieval.protocol,
            );
            ports.postLog(`INFO: dialed with protocol ${filecoinRetrieval.protocol}`);

            // TODO:  implement custom protocol per https://docs.google.com/document/d/1ye0C7_kdnDCfcV8KsQCRafCDvrjRkiilqW9NlXF3M7Q/edit#

            pipe(['payment voucher 1... payment voucher 2...'], stream, async function (source) {
              for await (const data of source) {
                ports.postLog(`INFO: received: ${data.toString()}`);
              }
            });
          }
          break;

        default:
          break;
      }
    } catch (error) {
      ports.postLog(`ERROR: ${error.message}`);
    }
  });

  //
  // Publish on gossipsub any CIDs we want to retrieve
  //
  chrome.runtime.onMessage.addListener(({ messageType, cid }) => {
    if (messageType === filecoinRetrieval.messageType.query) {
      queriedCids.add(cid);
      ports.postLog(`INFO: querying: ${cid}`);
      publish({ messageType, cid });
    }
  });
}

export default run;
