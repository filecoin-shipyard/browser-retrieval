/* eslint-disable no-unused-vars */
import { DateTime } from 'luxon';
import Lotus from 'src/background/lotus-client/Lotus';
import ports from 'src/background/ports';

import { errorToJSON } from './errorToJson';
import { Operations, operations } from './Operations';

/* eslint-enable no-unused-vars */

/**
 * @typedef {Object} Operation
 * @property {string} id ID for tracking purposes
 * @property {string} label Name of the operation
 * @property {keyof Operations} f The function to run
 * @property {{[key: string]: any}} metadata Metadata such as deal info
 * @property {Date} invokeAt The time to invoke the function
 * @property {'waiting' | 'running' | 'done' | 'failed'} status The status of the operation
 * @property {number} attempts Number of attempts so far
 * @property {string} output Function output
 */

class OperationsQueue {
  /**
   * @type Lotus
   */
  lotus;

  constructor() {
    this.initializeActionsQueue();
  }

  /**
   * @readonly
   */
  get localStorageKey() {
    return 'OperationsQueue';
  }

  /**
   * Interval to watch for new operations in the queue.
   *
   * @readonly
   */
  get listenInterval() {
    return 1000; // 1 sec
  }

  /**
   * Number of times it can retry to execute the operation.
   *
   * @readonly
   */
  get retryLimit() {
    return 0;
  }

  /**
   * @returns {Array.<Operation>} Operations array
   */
  get operations() {
    const ops = localStorage[this.localStorageKey] || '[]';

    return JSON.parse(ops).map((op) => ({
      ...op,
      invokeAt: op.invokeAt ? new Date(op.invokeAt) : undefined,
    }));
  }

  /**
   * @param {Array.<Operation>} value Operations
   */
  set operations(value) {
    localStorage[this.localStorageKey] = JSON.stringify(value);
  }

  /**
   * @param {Operation} op Operation
   */
  queue(op) {
    if (!op.f || !op.metadata) {
      throw new Error('OperationsQueue: Function and metadata are required');
    }

    const ops = this.operations;

    ops.push({
      ...op,
      id: Date.now() + Math.random().toString(36).substr(2, 9),
    });

    this.operations = ops;
  }

  /**
   * @param {Operation} op Operation to remove.
   */
  remove(op) {
    const ops = this.operations;

    this.operations = ops.filter((o) => o.id !== op.id);
  }

  /**
   * Finds and updates an operation stored.
   *
   * @param {Operation} op Operation
   * @param {Partial.<Operation>} props Operation props
   */
  updateOperation(op, props) {
    const ops = this.operations;

    const newOps = ops.map((storedOp) => {
      if (storedOp.id === op.id) {
        return {
          ...storedOp,
          ...props,
        };
      }

      return storedOp;
    });

    this.operations = newOps;
  }

  async initializeActionsQueue() {
    ports.postLog('DEBUG: OperationsQueue.initializeActionsQueue()');

    try {
      this.lotus = await Lotus.create();

      while (true) {
        for (const op of this.operations) {
          if (op.invokeAt && op.invokeAt <= new Date()) {
            ports.postLog(`DEBUG: OperationsQueue.runOperation(): ${op.label}`);
            this.runOperation(op);
          }
        }

        await new Promise((r) => setTimeout(r, this.listenInterval));
      }
    } catch (err) {
      ports.postLog('ERROR: Lotus create failed in initializeActionsQueue function');
    }
  }

  /**
   * Run a scheduled operation without locking the app.
   *
   * @param {Operation} op Operation
   */
  async runOperation(op) {
    ports.postLog('DEBUG: OperationsQueue.runOperation(op)');

    try {
      this.updateOperation(op, {
        status: 'running',
      });

      const response = await operations[op.f](this.lotus, op.metadata);

      this.updateOperation(op, {
        status: 'done',
        invokeAt: undefined,
        output: response,
      });
    } catch (err) {
      const attempts = (op.attempts || 0) + 1;

      const errorObj = errorToJSON(err);

      ports.postLog(`ERROR: Running scheduled operation\n${JSON.stringify(errorObj, null, 2)}`);

      if (attempts > this.retryLimit) {
        this.updateOperation(op, {
          status: 'failed',
          attempts,
          invokeAt: undefined,
          output: `Error: ${errorObj.message}`,
        });
      } else {
        this.updateOperation(op, {
          status: 'waiting',
          attempts,
          invokeAt: DateTime.local().plus({
            seconds: Math.max(2000, 2 ** attempts * 100),
          }),
          output: `Error: ${errorObj.message}`,
        });
      }
    }
  }
}

export const operationsQueue = new OperationsQueue();
