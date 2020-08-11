import pipe from 'it-pipe';
import pushable from 'it-pushable';
import BigNumber from 'bignumber.js';
import onOptionsChanged from 'src/shared/onOptionsChanged';
import protocols from 'src/shared/protocols';
import dealStatuses from 'src/shared/dealStatuses';
import getOptions from 'src/shared/getOptions';
import jsonStream from 'src/shared/jsonStream';
import ports from 'src/background/ports';

class Provider {
  static async create(...args) {
    const provider = new Provider(...args);
    await provider.initialize();
    return provider;
  }

  ongoingDeals = {};

  constructor(node, datastore, lotus) {
    this.node = node;
    this.datastore = datastore;
    this.lotus = lotus;
  }

  async initialize() {
    await this.updateOptions();
    onOptionsChanged(this.handleOptionsChange);
    this.node.handle(protocols.filecoinRetrieval, this.handleProtocol);
  }

  async updateOptions() {
    const { getDealParamsHook } = await getOptions();
    // eslint-disable-next-line no-new-func
    this.getDealParamsHook = new Function('cid', getDealParamsHook);
  }

  handleOptionsChange = async changes => {
    if (changes['getDealParams']) {
      try {
        await this.updateOptions();
      } catch (error) {
        console.error(error);
        ports.postLog(`ERROR: update payment interval failed: ${error.message}`);
      }
    }
  };

  async getDealParams(cid) {
    ports.postLog(`DEBUG: getting deal params for ${cid}`);
    const { knownCids } = await getOptions();
    const cidInfo = knownCids[cid];

    if (cidInfo) {
      try {
        const { pricePerByte, paymentInterval, paymentIntervalIncrease } = this.getDealParamsHook(
          cid,
        );

        if (
          typeof pricePerByte !== 'number' ||
          typeof paymentInterval !== 'number' ||
          typeof paymentIntervalIncrease !== 'number' ||
          pricePerByte <= 0 ||
          paymentInterval <= 0 ||
          paymentIntervalIncrease < 0
        ) {
          throw new Error(
            `Invalid deal params returned from hook: ${JSON.stringify({
              pricePerByte,
              paymentInterval,
              paymentIntervalIncrease,
            })}`,
          );
        }

        return {
          wallet: this.lotus.wallet,
          size: cidInfo.size,
          pricePerByte: new BigNumber(pricePerByte),
          paymentInterval,
          paymentIntervalIncrease,
        };
      } catch (error) {
        console.error(error);
        ports.postLog(`ERROR: get deal params hook failed: ${error.message}`);
      }
    }

    return null;
  }

  handleProtocol = async ({ stream }) => {
    ports.postLog(`DEBUG: handling protocol ${protocols.filecoinRetrieval}`);
    const sink = pushable();
    pipe(sink, jsonStream.stringify, stream, jsonStream.parse, async source => {
      for await (const message of source) {
        try {
          ports.postLog(`DEBUG: handling protocol message ${JSON.stringify(message)}`);

          switch (message.status) {
            case dealStatuses.client.awaitingAcceptance: {
              await this.handleNewDeal(message, sink);
              break;
            }

            case dealStatuses.client.paymentChannelReady: {
              await this.savePaymentChannel(message);
              await this.sendBlocks(message);
              break;
            }

            case dealStatuses.client.paymentSent: {
              await this.checkPaymentVoucherValid(message);
              await this.sendBlocks(message);
              break;
            }

            case dealStatuses.client.lastPaymentSent: {
              await this.submitPaymentVoucher(message);
              await this.sendDealCompleted(message);
              await this.closeDeal(message);
              break;
            }

            default: {
              ports.postLog(`ERROR: unknown deal message received: ${JSON.stringify(message)}`);
              sink.end();
              break;
            }
          }
        } catch (error) {
          sink.end();
          console.error(error);
          ports.postLog(`ERROR: handle deal message failed: ${error.message}`);
          await this.closeDeal(message);
        }
      }
    });
  };

  async handleNewDeal({ dealId, cid, params }, sink) {
    ports.postLog(`DEBUG: handling new deal ${dealId}`);
    if (this.ongoingDeals[dealId]) {
      throw new Error('A deal already exists for the given id');
    }

    const currentParams = await this.getDealParams(cid);

    if (params.wallet !== currentParams.wallet) {
      throw new Error('Not my wallet');
    }

    if (params.pricePerByte < currentParams.pricePerByte) {
      throw new Error('Price per byte too low');
    }

    if (params.paymentInterval > currentParams.paymentInterval) {
      throw new Error('Payment interval too large');
    }

    if (params.paymentIntervalIncrease > currentParams.paymentIntervalIncrease) {
      throw new Error('Payment interval increase too large');
    }

    const deal = {
      id: dealId,
      cid,
      params,
      sink,
      sizeSent: 0,
    };

    this.ongoingDeals[dealId] = deal;

    ports.postLog(`DEBUG: sending deal accepted ${dealId}`);
    deal.status = dealStatuses.provider.accepted;
    deal.sink.push({
      dealId,
      status: deal.status,
    });

    ports.postOutboundDeals(this.ongoingDeals);
  }

  async savePaymentChannel({ dealId, paymentChannel }) {
    ports.postLog(`DEBUG: saving payment channel ${dealId}`);
    const deal = this.ongoingDeals[dealId];
    deal.paymentChannel = paymentChannel;
  }

  async sendBlocks({ dealId }) {
    ports.postLog(`DEBUG: sending blocks ${dealId}`);
    const deal = this.ongoingDeals[dealId];
    const entry = await this.datastore.get(deal.cid);

    const blocks = [];
    let blocksSize = 0;
    for await (const block of entry.content({ offset: deal.sizeSent })) {
      blocks.push(block);
      blocksSize += block.length;

      if (blocksSize >= deal.params.paymentInterval) {
        break;
      }
    }

    deal.params.paymentInterval += deal.params.paymentIntervalIncrease;
    deal.sizeSent += blocksSize;
    deal.status =
      deal.sizeSent < deal.params.size
        ? dealStatuses.provider.fundsNeeded
        : dealStatuses.provider.fundsNeededLastPayment;

    deal.sink.push({
      dealId,
      status: deal.status,
      blocks,
    });

    ports.postOutboundDeals(this.ongoingDeals);
  }

  async checkPaymentVoucherValid({ dealId, paymentVoucher }) {
    ports.postLog(`DEBUG: checking voucher ${dealId}`);
    const deal = this.ongoingDeals[dealId];
    await this.lotus.checkPaymentVoucherValid(deal.paymentChannel, paymentVoucher);
    // TODO: check voucher amount
    // TODO: save voucher to submit later if deal fails
  }

  async submitPaymentVoucher({ dealId, paymentVoucher }) {
    ports.postLog(`DEBUG: submitting voucher ${dealId}`);
    const deal = this.ongoingDeals[dealId];
    await this.lotus.submitPaymentVoucher(deal.paymentChannel, paymentVoucher);
  }

  async sendDealCompleted({ dealId }) {
    ports.postLog(`DEBUG: sending deal completed ${dealId}`);
    const deal = this.ongoingDeals[dealId];
    deal.status = dealStatuses.provider.completed;
    deal.sink.push({ dealId, status: deal.status });
  }

  async closeDeal({ dealId }) {
    ports.postLog(`DEBUG: closing deal ${dealId}`);
    const deal = this.ongoingDeals[dealId];

    if (deal) {
      deal.sink.end();
      delete this.ongoingDeals[dealId];
    }

    ports.postOutboundDeals(this.ongoingDeals);
  }
}

export default Provider;
