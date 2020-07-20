import pipe from 'it-pipe';
import pushable from 'it-pushable';
import protocols from 'src/shared/protocols';
import dealStatuses from 'src/shared/dealStatuses';
import getOptions from 'src/shared/getOptions';
import jsonStream from 'src/shared/jsonStream';
import ports from 'src/background/ports';

class Provider {
  ongoingDeals = {};

  constructor(node, datastore, lotus) {
    this.node = node;
    this.datastore = datastore;
    this.lotus = lotus;
    this.node.handle(protocols.filecoinRetrieval, this.handleProtocol);
  }

  async getDealParams(cid) {
    ports.postLog(`DEBUG: getting deal params for ${cid}`);
    const { pricesPerByte, knownCids } = await getOptions();
    const cidInfo = knownCids[cid];

    if (cidInfo) {
      const pricePerByte = pricesPerByte[cid] || pricesPerByte['*'];
      return {
        wallet: this.lotus.wallet,
        size: cidInfo.size,
        pricePerByte,
        // TODO: paymentInterval, paymentIntervalIncrease
      };
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
            case dealStatuses.awaitingAcceptance: {
              await this.handleNewDeal(message, sink);
              break;
            }

            case dealStatuses.paymentChannelReady: {
              await this.sendBlocks(message);
              break;
            }

            case dealStatuses.paymentSent: {
              await this.checkPaymentVoucherValid(message);
              await this.sendBlocks(message);
              break;
            }

            case dealStatuses.lastPaymentSent: {
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

    this.ongoingDeals[dealId] = {
      id: dealId,
      status: dealStatuses.awaitingAcceptance,
      cid,
      params,
      sink,
    };

    // TODO: decide on deal

    await this.sendDealAccepted({ dealId, wallet: this.wallet });
  }

  sendDealAccepted({ dealId }) {
    ports.postLog(`DEBUG: sending deal accepted ${dealId}`);
    const deal = this.ongoingDeals[dealId];

    deal.sink.push({
      dealId,
      status: dealStatuses.accepted,
    });
  }

  async sendBlocks({ dealId }) {
    ports.postLog(`DEBUG: sending blocks ${dealId}`);
    const deal = this.ongoingDeals[dealId];

    const data = await this.datastore.get(deal.cid);
    // TODO: split data into blocks
    deal.sink.push({
      dealId,
      status: dealStatuses.fundsNeededLastPayment,
      blocks: [data],
    });
  }

  async checkPaymentVoucherValid({ dealId, paymentChannel, paymentVoucher }) {
    ports.postLog(`DEBUG: checking voucher ${dealId}`);
    // TODO: test it after they fix https://github.com/Zondax/filecoin-signing-tools/issues/200
    // await this.lotus.checkPaymentVoucherValid(paymentChannel, paymentVoucher);
    // TODO: save voucher to submit later if deal fails
  }

  async submitPaymentVoucher({ dealId, paymentChannel, paymentVoucher }) {
    ports.postLog(`DEBUG: submitting voucher ${dealId}`);
    // TODO: test it after they fix https://github.com/Zondax/filecoin-signing-tools/issues/200
    // await this.lotus.submitPaymentVoucher(paymentChannel, paymentVoucher);
  }

  async sendDealCompleted({ dealId }) {
    ports.postLog(`DEBUG: sending deal completed ${dealId}`);
    const deal = this.ongoingDeals[dealId];
    deal.sink.push({ dealId, status: dealStatuses.completed });
  }

  async closeDeal({ dealId }) {
    ports.postLog(`DEBUG: closing deal ${dealId}`);
    const deal = this.ongoingDeals[dealId];
    deal.sink.end();
    delete this.ongoingDeals[dealId];
  }
}

export default Provider;
