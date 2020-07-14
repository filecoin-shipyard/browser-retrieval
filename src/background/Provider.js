import pipe from 'it-pipe';
import pushable from 'it-pushable';
import protocols from 'src/shared/protocols';
import dealStatuses from 'src/shared/dealStatuses';
import getOptions from 'src/shared/getOptions';
import ports from './ports';
import jsonStream from 'src/shared/jsonStream';

class Provider {
  ongoingDeals = {};

  constructor(node, datastore, wallet) {
    this.node = node;
    this.datastore = datastore;
    this.wallet = wallet;
    this.node.handle(protocols.filecoinRetrieval, this.handleProtocol);
  }

  async getDealParams(cid) {
    ports.postLog(`DEBUG: getting deal params for ${cid}`);
    const { pricesPerByte, knownCids } = await getOptions();
    const cidInfo = knownCids[cid];

    if (cidInfo) {
      const pricePerByte = pricesPerByte[cid] || pricesPerByte['*'];
      return { ...cidInfo, pricePerByte }; // TODO: paymentInterval, paymentIntervalIncrease
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

    await this.sendDealAccepted({ dealId });
    await this.sendBlocks({ dealId });
  }

  sendDealAccepted({ dealId }) {
    const deal = this.ongoingDeals[dealId];

    deal.sink.push({
      dealId,
      status: dealStatuses.accepted,
    });
  }

  async sendBlocks({ dealId }) {
    const deal = this.ongoingDeals[dealId];

    const data = await this.datastore.get(deal.cid);
    // TODO: split data into blocks
    deal.sink.push({
      dealId,
      status: dealStatuses.blocksComplete,
      blocks: [data],
    });

    deal.sink.end();
  }
}

export default Provider;
