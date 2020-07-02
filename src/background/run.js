import PeerId from 'peer-id';
import Libp2p from 'libp2p';
import Websockets from 'libp2p-websockets';
import WebrtcStar from 'libp2p-webrtc-star';
import Mplex from 'libp2p-mplex';
import { NOISE } from 'libp2p-noise';
import Secio from 'libp2p-secio';
import Gossipsub from 'libp2p-gossipsub';
import channels from 'src/shared/channels';
import ports from './ports';
// import multiaddr from 'multiaddr';
// import pipe from 'it-pipe'
// import { Math, clearInterval } from 'ipfs-utils/src/globalthis'
// import LocalCids from './local-cids.js'

async function run(options) {
  const { rendezvousIp, rendezvousPort } = options;
  const rendezvousProtocol = /^\d+\.\d+\.\d+\.\d+$/.test(rendezvousIp) ? 'ip4' : 'dns';
  const rendezvousWsProtocol = `${rendezvousPort}` === '443' ? 'wss' : 'ws';

  const peerId = await PeerId.create();

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
  const peerIds = new Set();
  postPeers(peerIds);
  libp2p.connectionManager.on('peer:connect', connection => {
    peerIds.add(connection.remotePeer.toB58String());
    postPeers(peerIds);
  });
  libp2p.connectionManager.on('peer:disconnect', connection => {
    peerIds.delete(connection.remotePeer.toB58String());
    postPeers(peerIds);
  });

  // //
  // // Stream handler for protocol /fil-retrieval/0.1.0
  // //
  // async function filRetrieveProtocolHandler({ connection, stream }) {
  //   // TODO:  implement custom protocol per https://docs.google.com/document/d/1ye0C7_kdnDCfcV8KsQCRafCDvrjRkiilqW9NlXF3M7Q/edit#
  //   try {
  //     await pipe(stream, async function (source) {
  //       for await (const message of source) {
  //         console.info(strProtocolName + `> ${String(message)}`);
  //       }
  //     });
  //     await pipe([strRetrievedCIDBytes], stream.sink);
  //   } catch (err) {
  //     console.error('handler error: ' + err);
  //   }
  // }
  // libp2p.handle(strProtocolName, filRetrieveProtocolHandler);

  //
  // Start listening
  //
  postListeningState();
  await libp2p.start();
  const multiaddrStrs = libp2p.multiaddrs.map(ma => ma.toString() + '/p2p/' + peerId.toB58String());
  postListeningState(multiaddrStrs);

  // //
  // // Dial another peer if a multiaddr was specified
  // //
  // if (otherMultiaddr != undefined) {
  //   console.log('Dialing peer:', otherMultiaddr);
  //   await libp2p.dial(otherMultiaddr);
  // } else {
  //   console.log('Not dialing other peer: none specified');
  // }
  // //
  // // Pubsub channel subscribe + message handling
  // //
  // libp2p.pubsub.subscribe(
  //   strTopic,
  //   // Handle incoming pubsub messages
  //   message => {
  //     const pubsubMsgStr = message.data.toString('utf8', 0, message.data.length);
  //     console.log(chalk.redBright('gossip> ') + pubsubMsgStr);
  //     // Try to parse message as JSON; ignore if invalid
  //     var obj = undefined;
  //     try {
  //       obj = JSON.parse(pubsubMsgStr);
  //     } catch (err) {
  //       // silently ignore messages we cannot parse as JSON
  //     }
  //     //
  //     // Handle 'request' messages
  //     //
  //     if (obj && obj['messageType'] && obj['messageType'] == 'request') {
  //       console.log(chalk.redBright('gossip> ') + 'received valid JSON:' + pubsubMsgStr);
  //       const cidStr = obj.cid;
  //       // Check if this node has cidStr in local cache
  //       var localCids = new LocalCids(config);
  //       var localCid = localCids.get(cidStr);
  //       if (localCid != undefined) {
  //         console.log(chalk.redBright('gossip> ') + 'I have localCid[cid]=' + localCid['cidStr']);
  //         // publish an 'available' message
  //         var otherFields = new Object();
  //         otherFields['multiAddrs'] = multiaddrStrs;
  //         otherFields['pricePerByte'] = localCid['pricePerByte'];
  //         // TODO
  //         // otherFields['Size']
  //         // otherFields['Total']
  //         // otherFields['paymentInterval']
  //         // otherFields['Miner']
  //         // otherFields['MinerPeerId']
  //         sendPubsubMessage('available', localCid['cidStr'], otherFields);
  //       } else {
  //         console.log(
  //           chalk.redBright('gossip> ') + "not replying b/c don't have CID '" + cidStr + "'",
  //         );
  //       }
  //       //
  //       // Handle 'available' messages
  //       //
  //     } else if (obj && obj['messageType'] && obj['messageType'] == 'available') {
  //       const cidAvailable = obj['cid'];
  //       const multiAddrsArrrayOfPeersHavingCid = obj['multiAddrs'];
  //       console.log(chalk.redBright('gossip> ') + 'cid available announcement:  ' + cidAvailable);
  //       // is the 'available' message announcing a CID we are trying to retrieve?
  //       if (options.retrieve_cid == cidAvailable) {
  //         console.log(
  //           chalk.redBright('gossip> ') +
  //             "peer '" +
  //             multiAddrsArrrayOfPeersHavingCid[0] +
  //             "' has announced availability of a cid I want '" +
  //             cidAvailable +
  //             "'",
  //         );
  //         retrieveCidFromPeerAsync(libp2p, cidAvailable, multiAddrsArrrayOfPeersHavingCid); // TODO:  size, total, paymentInterval, paymentIntervalIncrease, pricePerByte
  //       }
  //       // TODO:  don't just accept the first 'available' message for a CID you want;
  //       // rather, build an array of offers that come in through 'available' messages
  //       // and then pick the lowest to initiate a retrieval from
  //       // TODO:  in addition to querying peers, query the Lotus instance at
  //       // config.configMap['lotus_url'] to see if any storage miners have this CID.
  //       // If they do, have the Lotus do a QueryMinerAsk to get their price for the CID
  //       // and add that offer to the array so it can be considered along with peer offers.
  //       // TODO:  create a parallel function to retrieveCidFromPeer() called
  //       // retrieveCidFromStorageMiner() which takes a storage miner Id instead of a
  //       // peerId
  //       //
  //       // Handle all other messages
  //       //
  //     } else if (obj && obj['messageType']) {
  //       console.log(
  //         chalk.redBright('gossip> ') +
  //           "Don't understand message type '" +
  //           obj['messageType'] +
  //           "', ignoring",
  //       );
  //     }
  //   },
  // );
  // //
  // // Publish on gossipsub any CIDs we want to retrieve ('-r' on CLI)
  // //
  // if (options.retrieve_cid != undefined) {
  //   sendPubsubMessage('request', options.retrieve_cid);
  // }
  // //////////////////////// -- end of main program -- ////////////////////////
  // //
  // // Helper functions
  // //
  // // retrieve a CID over the custom protocol
  // async function retrieveCidFromPeerAsync(libp2p, cidAvailable, multiAddrsArrrayOfPeerHavingCid) {
  //   // TODO:  size, total, paymentInterval, paymentIntervalIncrease, pricePerByte
  //   console.log(chalk.bgYellowBright("Starting retrieval of '" + cidAvailable + "'"));
  //   // TODO:  don't just use the 0th mutliaddr in the array, try them individually
  //   // until a connection is established
  //   const { stream } = await libp2p.dialProtocol(
  //     multiAddrsArrrayOfPeerHavingCid[0],
  //     strProtocolName,
  //   );
  //   console.log(
  //     chalk.bgYellowBright(
  //       'Dialed "' + multiAddrsArrrayOfPeerHavingCid[0] + '" with protocol: ' + strProtocolName,
  //     ),
  //   );
  //   // TODO:  implement custom protocol per https://docs.google.com/document/d/1ye0C7_kdnDCfcV8KsQCRafCDvrjRkiilqW9NlXF3M7Q/edit#
  //   pipe(
  //     // Source (send payment vouchers, expecting to receive bytes of your data CID)
  //     ['payment voucher 1... payment voucher 2...'],
  //     stream,
  //     // Sink
  //     async function (source) {
  //       for await (const data of source) {
  //         console.log(chalk.bgYellowBright(strProtocolName + '> received data:', data.toString()));
  //       }
  //     },
  //   );
  // }
  // // send a JSON pubsub message
  // function sendPubsubMessage(msgTypeStr, cidStr, otherArgumentsObj) {
  //   setTimeout(() => {
  //     var o;
  //     if (otherArgumentsObj != undefined) {
  //       o = Object.assign(otherArgumentsObj);
  //     } else {
  //       o = new Object();
  //     }
  //     o['messageType'] = msgTypeStr;
  //     o['cid'] = cidStr;
  //     const jsonCidRequest = JSON.stringify(o);
  //     libp2p.pubsub.publish(strTopic, jsonCidRequest);
  //   }, 1000);
  // }
}

function postPeers(peerIds) {
  ports.postMessage(
    channels.peers,
    peerIds.length ? peerIds.join('\n') : 'Not connected to any peer',
  );
}

function postListeningState(multiaddrStrs) {
  ports.postMessage(channels.listening, multiaddrStrs ? multiaddrStrs.join('\n') : 'Not listening');
}

export default run;
