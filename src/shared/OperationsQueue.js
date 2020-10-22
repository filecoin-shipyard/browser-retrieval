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
 * @property {'waiting' | 'running' | 'done'} status The status of the operation
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
   * @returns {Operation} Next operation in queue
   */
  dequeue() {
    const ops = this.operations;

    const next = ops.shift();

    this.operations = ops;

    return next;
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
      this.updateOperation(op, {
        status: 'waiting',
        attempts: (op.attempts || 0) + 1,
        invokeAt: DateTime.local().plus({ minutes: 10 }), // TODO: <<-- retry in,
        output: `Error: ${errorToJSON(err)}`,
      });
    }
  }
}

export const operationsQueue = new OperationsQueue();
