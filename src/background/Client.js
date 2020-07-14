import pipe from 'it-pipe';
import pushable from 'it-pushable';
import protocols from 'src/shared/protocols';
import dealStatuses from 'src/shared/dealStatuses';
import jsonStream from 'src/shared/jsonStream';
import ports from './ports';

class Client {
  ongoingDeals = {};

  constructor(node, datastore, wallet, cidReceivedCallback) {
    this.node = node;
    this.datastore = datastore;
    this.wallet = wallet;
    this.cidReceivedCallback = cidReceivedCallback;
  }

  async retrieve(cid, dealParams, peerMultiaddr, peerWallet) {
    ports.postLog(`DEBUG: dialing peer ${peerMultiaddr}`);
    const { stream } = await this.node.dialProtocol(peerMultiaddr, protocols.filecoinRetrieval);

    const sink = pushable();
    pipe(sink, jsonStream.stringify, stream, jsonStream.parse, this.handleMessage);

    const dealId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    this.ongoingDeals[dealId] = {
      id: dealId,
      status: dealStatuses.new,
      cid,
      params: dealParams,
      peerMultiaddr,
      peerWallet,
      sink,
    };

    await this.sendDealProposal({ dealId });
  }

  handleMessage = async source => {
    for await (const message of source) {
      try {
        ports.postLog(`DEBUG: handling protocol message ${JSON.stringify(message)}`);
        const deal = this.ongoingDeals[message.dealId];

        if (!deal) {
          throw new Error(`Deal not found for message ${JSON.stringify(message)}`);
        }

        switch (message.status) {
          case dealStatuses.accepted: {
            deal.status = dealStatuses.accepted;
            await this.setupPaymentChannel(message);
            break;
          }

          case dealStatuses.blocksComplete: {
            deal.status = dealStatuses.finalizing;
            await this.receiveBlocks(message);
            break;
          }

          default: {
            ports.postLog(`ERROR: unknown deal message received: ${JSON.stringify(message)}`);
            deal.sink.end();
            break;
          }
        }
      } catch (error) {
        console.error(error);
        ports.postLog(`ERROR: handle deal message failed: ${error.message}`);
      }
    }
  };

  sendDealProposal({ dealId }) {
    ports.postLog(`DEBUG: sending deal proposal ${dealId}`);
    const deal = this.ongoingDeals[dealId];

    deal.sink.push({
      dealId,
      status: dealStatuses.awaitingAcceptance,
      cid: deal.cid,
      params: deal.params,
    });

    deal.status = dealStatuses.awaitingAcceptance;
  }

  setupPaymentChannel({ dealId }) {
    ports.postLog(`DEBUG: setting up payment channel ${dealId}`);
    // TODO: getChainHead
    // TODO: getOrCreatePaymentChannel
    // TODO: allocateLane
  }

  async receiveBlocks({ dealId, blocks }) {
    ports.postLog(`DEBUG: received ${blocks.length} blocks ${dealId}`);
    const deal = this.ongoingDeals[dealId];

    if (deal.status === dealStatuses.finalizing) {
      const { cid, size } = await this.datastore.putData(blocks[0]);
      delete this.ongoingDeals[dealId];
      await this.cidReceivedCallback(cid, size);
      deal.sink.end();
    }
  }
}

export default Client;
