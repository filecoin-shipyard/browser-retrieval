import pipe from 'it-pipe';
import pushable from 'it-pushable';
import protocols from 'src/shared/protocols';
import dealStatuses from 'src/shared/dealStatuses';
import jsonStream from 'src/shared/jsonStream';
import ports from 'src/background/ports';

class Client {
  static async create(...args) {
    return new Client(...args);
  }

  ongoingDeals = {};

  constructor(node, datastore, lotus, cidReceivedCallback) {
    this.node = node;
    this.datastore = datastore;
    this.lotus = lotus;
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
      sizeReceived: 0,
      sizePaid: 0,
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

          case dealStatuses.fundsNeeded: {
            deal.status = dealStatuses.ongoing;
            await this.receiveBlocks(message);
            // TODO: size received vs deal params and send voucher
            break;
          }

          case dealStatuses.fundsNeededLastPayment: {
            deal.status = dealStatuses.finalizing;
            await this.receiveBlocks(message);
            await this.sendLastPayment(message);
            break;
          }

          case dealStatuses.completed: {
            await this.closeDeal(message);
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

  async setupPaymentChannel({ dealId }) {
    ports.postLog(`DEBUG: setting up payment channel ${dealId}`);
    const deal = this.ongoingDeals[dealId];

    // TODO: test it after they fix https://github.com/Zondax/filecoin-signing-tools/issues/200
    // deal.paymentChannel = await this.lotus.getOrCreatePaymentChannel(
    //   deal.params.wallet,
    //   deal.params.size * deal.params.pricePerByte,
    // );
    // deal.lane = await this.lotus.allocateLane(deal.paymentChannel);

    ports.postLog(`DEBUG: sending payment channel ready ${dealId}`);
    deal.sink.push({
      dealId,
      status: dealStatuses.paymentChannelReady,
    });

    deal.status = dealStatuses.paymentChannelReady;
  }

  async receiveBlocks({ dealId, blocks }) {
    ports.postLog(`DEBUG: received ${blocks.length} blocks ${dealId}`);
    const deal = this.ongoingDeals[dealId];

    for (const block of blocks) {
      await this.datastore.putData(block);
      deal.sizeReceived += block.length;
    }
  }

  async sendLastPayment({ dealId }) {
    ports.postLog(`DEBUG: sending last payment ${dealId}`);
    const deal = this.ongoingDeals[dealId];

    // TODO: test it after they fix https://github.com/Zondax/filecoin-signing-tools/issues/200
    // const amount = (deal.params.size - deal.sizePaid) * deal.params.pricePerByte;
    // const paymentVoucher = await this.lotus.createPaymentVoucher(
    //   deal.paymentChannel,
    //   deal.lane,
    //   amount,
    // );

    deal.sink.push({
      dealId,
      status: dealStatuses.lastPaymentSent,
      // paymentChannel: deal.paymentChannel,
      // paymentVoucher,
    });
  }

  async closeDeal({ dealId }) {
    ports.postLog(`DEBUG: closing deal ${dealId}`);
    const deal = this.ongoingDeals[dealId];
    // TODO: test it after they fix https://github.com/Zondax/filecoin-signing-tools/issues/200
    // this.lotus.closePaymentChannel(deal.paymentChannel);
    deal.sink.end();
    delete this.ongoingDeals[dealId];
    await this.cidReceivedCallback(deal.cid, deal.params.size);
  }
}

export default Client;
