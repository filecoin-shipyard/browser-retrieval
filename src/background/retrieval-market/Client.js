import pipe from 'it-pipe';
import pushable from 'it-pushable';
import ports from 'src/background/ports';
import dealStatuses from 'src/shared/dealStatuses';
import jsonStream from 'src/shared/jsonStream';
import protocols from 'src/shared/protocols';
import inspect from 'browser-util-inspect';

class Client {
  static async create(...args) {
    return new Client(...args);
  }

  /**
   * @typedef {Object} Deal
   * @property {string} id The deal id
   * @property {string} status The deal status for the app to handle
   * @property {string} customStatus A custom status message to display the user
   * @property {string} cid CID of the deal
   * @property {string} params Params
   * @property {string} peerMultiaddr Peer address
   * @property {string} peerWallet Peer wallet
   * @property {string} sink Sink
   * @property {string} sizeReceived Total bytes received
   * @property {string} sizePaid Total bytes paid
   * @property {string} importerSink Importer sink
   * @property {string} importer Importer
   */
  /**
   * Deals dictionary.
   *
   * @type {Object.<string, Deal>}
   */
  ongoingDeals = {};

  constructor(node, datastore, lotus, cidReceivedCallback) {
    ports.postLog('DEBUG: Client.constructor()');
    this.node = node;
    this.datastore = datastore;
    this.lotus = lotus;
    this.cidReceivedCallback = cidReceivedCallback;
  }

  /**
   * Retrieves a file
   * @param  {string} cid CID of the file to retrieve
   * @param  {object} dealParams Deal parameters
   * @param  {string} dealParams.wallet Server wallet (PCH "To" wallet)
   * @param  {number} dealParams.size File total size
   * @param  {string} dealParams.pricePerByte Price to construct a BigNumber
   * @param  {string} peerMultiaddr Address from where to get the file from
   * @param  {string} peerWallet Client wallet addr (PCH "From" wallet)
   */
  async retrieve(cid, dealParams, peerMultiaddr, peerWallet) {
    ports.postLog('DEBUG: Client.retrieve()');
    ports.postLog(`MIKE: retrieve called with\n  cid='${cid}'\n  dealParams='${inspect(dealParams)}'\n  peerMultiaddr=${peerMultiaddr}\n  peerWallet=${peerWallet}`);
    ports.postLog(`DEBUG: dialing peer ${peerMultiaddr}`);
    const { stream } = await this.node.dialProtocol(peerMultiaddr, protocols.filecoinRetrieval);

    const sink = pushable();
    pipe(sink, jsonStream.stringify, stream, jsonStream.parse, this.handleMessage);

    const importerSink = pushable();

    // TODO:  should dealId be random?  Maybe, but check this
    // TODO:  rand % max int  eliminate Math.floor
    const dealId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    this.ongoingDeals[dealId] = {
      id: dealId,
      status: dealStatuses.new,
      customStatus: undefined,
      cid,
      params: dealParams,
      peerMultiaddr,
      peerWallet,
      sink,
      sizeReceived: 0,
      sizePaid: 0,
      importerSink,
      importer: this.datastore.putContent(importerSink),
      voucherNonce: 1,
    };

    await this.sendDealProposal({ dealId });
    ports.postInboundDeals(this.ongoingDeals);
  }

  handleMessage = async (source) => {
    for await (const message of source) {
      try {
        ports.postLog(`DEBUG: Client.handleMessage(): message: ${inspect(message)}`);
        const deal = this.ongoingDeals[message.dealId];

        if (!deal) {
          throw new Error(`Deal not found: ${message.dealId}`);
        }

        switch (message.status) {
          case dealStatuses.accepted: {
            ports.postLog('DEBUG: Client.handleMessage(): case dealStatuses.accepted');
            deal.status = dealStatuses.accepted;
            deal.customStatus = undefined;
            await this.setupPaymentChannel(message);
            break;
          }

          case dealStatuses.fundsNeeded: {
            ports.postLog('DEBUG: Client.handleMessage(): case dealStatuses.fundsNeeded');
            deal.status = dealStatuses.ongoing;
            deal.customStatus = undefined;
            await this.receiveBlocks(message);
            await this.sendPayment(message, false);
            break;
          }

          case dealStatuses.fundsNeededLastPayment: {
            ports.postLog('DEBUG: Client.handleMessage(): case dealStatuses.fundsNeededLastPayment');
            deal.status = dealStatuses.finalizing;
            deal.customStatus = undefined;
            await this.receiveBlocks(message);
            await this.finishImport(message);
            await this.sendPayment(message, true);
            break;
          }

          case dealStatuses.completed: {
            ports.postLog('DEBUG: Client.handleMessage(): case dealStatuses.completed');
            await this.closeDeal(message);
            break;
          }

          default: {
            ports.postLog('DEBUG: Client.handleMessage(): case default');
            ports.postLog(`ERROR: Client.handleMessage(): unknown deal message status received: ${message.status}`);
            deal.sink.end();
            break;
          }
        }
      } catch (error) {
        console.error(error);
        ports.postLog(`ERROR: Client.handleMessage(): handle deal message failed: ${error.message}`);
      }
    }
  };

  updateCustomStatus(str, deal) {
    deal.customStatus = str;
    ports.postInboundDeals(this.ongoingDeals);
  }

  sendDealProposal({ dealId }) {
    ports.postLog(`DEBUG: Client.sendDealProposal: sending deal proposal ${dealId}`);
    const deal = this.ongoingDeals[dealId];

    deal.sink.push({
      dealId,
      status: dealStatuses.awaitingAcceptance,
      cid: deal.cid,
      clientWalletAddr: this.lotus.wallet,
      params: deal.params,
    });

    deal.status = dealStatuses.awaitingAcceptance;
    deal.customStatus = undefined;
  }

  async setupPaymentChannel({ dealId }) {
    ports.postLog(`DEBUG: Client.setupPaymentChannel(): setting up payment channel ${dealId}`);
    const deal = this.ongoingDeals[dealId];

    const pchAmount = deal.params.size * deal.params.pricePerByte;
    const toAddr = deal.params.wallet

    this.updateCustomStatus("Creating payment channel", deal);

    ports.postLog(`DEBUG: Client.setupPaymentChannel(): PCH creation parameters:\n  pchAmount='${pchAmount}'\n  toAddr='${toAddr}'`);

    //await this.lotus.keyRecoverLogMsg();  // testing only
    
    deal.paymentChannel = await this.lotus.createPaymentChannel(toAddr, pchAmount);

    // Not using lanes currently
    deal.Lane = 0;

    ports.postLog(`DEBUG: Client.setupPaymentChannel(): sending payment channel ready (pchAddr='${deal.paymentChannel}') for dealId='${dealId}'`);
    deal.sink.push({
      dealId,
      status: dealStatuses.paymentChannelReady,
    });

    deal.status = dealStatuses.paymentChannelReady;
    deal.customStatus = undefined;

    ports.postLog(`DEBUG: Client.setupPaymentChannel(): done`);
  }

  async receiveBlocks({ dealId, blocks }) {
    ports.postLog(`DEBUG: Client.receiveBlocks(): received ${blocks.length} blocks deal id: ${dealId}`);
    const deal = this.ongoingDeals[dealId];
    this.updateCustomStatus("Receiving data", deal);

    for (const block of blocks) {
      deal.importerSink.push(block.data);
      deal.sizeReceived += block.data.length;
    }

    ports.postInboundDeals(this.ongoingDeals);
  }

  async finishImport({ dealId, blocks }) {
    ports.postLog(`DEBUG: Client.finishImport(): finishing import ${dealId}`);
    const deal = this.ongoingDeals[dealId];
    deal.importerSink.end();
    await deal.importer;
  }

  async sendPayment({ dealId }, isLastVoucher) {
    ports.postLog(`DEBUG: Client.sendPayment(): sending payment ${dealId} (isLastVoucher=${isLastVoucher})`);
    const deal = this.ongoingDeals[dealId];

    const amount = deal.sizeReceived * deal.params.pricePerByte;
    const nonce = deal.voucherNonce++;
    const sv = await this.lotus.createSignedVoucher(deal.paymentChannel,amount,nonce);
    ports.postLog(`DEBUG: Client.sendPayment(): sv = '${sv}'`);

    const newDealStatus = isLastVoucher ? dealStatuses.lastPaymentSent : dealStatuses.paymentSent;

    this.updateCustomStatus("Sent signed voucher", deal);

    deal.sink.push({
      dealId,
      status: newDealStatus,
      paymentChannel: deal.paymentChannel,
      signedVoucher: sv,
    });
  }

  async closeDeal({ dealId }) {
    ports.postLog(`DEBUG: Client.closeDeal: closing deal ${dealId}`);
    const deal = this.ongoingDeals[dealId];
    this.updateCustomStatus("Enqueueing channel collect operation", deal);
    // TODO:
    // this.lotus.closePaymentChannel(deal.paymentChannel);
    deal.sink.end();
    // TODO:  pend an operation to call Collect on the channel when cron class is available
    // TODO:  stopgap solution:  window.setTimeout() to try to ensure channel Collect
    delete this.ongoingDeals[dealId];
    await this.cidReceivedCallback(deal.cid, deal.params.size);
    ports.postInboundDeals(this.ongoingDeals);
  }
}

export default Client;
