import { DateTime } from 'luxon'
import { errorToJSON } from 'shared/errorToJson'
import { Lotus } from 'shared/lotus-client/Lotus'
import { operations } from 'shared/Operations'
import { appStore } from 'shared/store/appStore'

let operationsQueueInstance: OperationsQueue

export class OperationsQueue {
  lotus: Lotus

  static async create() {
    if (!operationsQueueInstance) {
      operationsQueueInstance = new OperationsQueue()

      await operationsQueueInstance.initialize()
    }

    return operationsQueueInstance
  }

  /**
   * Interval to watch for new operations in the queue.
   *
   * @readonly
   */
  get listenInterval() {
    return 1000 // 1 sec
  }

  /**
   * Number of times it can retry to execute the operation.
   *
   * @readonly
   */
  get retryLimit() {
    return 0
  }

  async initialize() {
    appStore.logsStore.logDebug('OperationsQueue.initializeActionsQueue()')

    try {
      this.lotus = await Lotus.create()

      while (true) {
        for (const op of appStore.operationsStore.operations) {
          if (op.invokeAt && op.invokeAt <= new Date()) {
            appStore.logsStore.logDebug(`OperationsQueue.runOperation(): ${op.label}`)
            this.runOperation(op)
          }
        }

        await new Promise((r) => setTimeout(r, this.listenInterval))
      }
    } catch (err) {
      appStore.logsStore.logDebug('Lotus create failed in initializeActionsQueue function')
    }
  }

  /**
   * Run a scheduled operation without locking the app.
   *
   * @param {Operation} op Operation
   */
  async runOperation(op) {
    appStore.logsStore.logDebug('OperationsQueue.runOperation(op)')

    try {
      this.updateOperation(op, {
        status: 'running',
      })

      const response = await operations[op.f](this.lotus, op.metadata)

      this.updateOperation(op, {
        status: 'done',
        invokeAt: undefined,
        output: response,
      })
    } catch (err) {
      const attempts = (op.attempts || 0) + 1

      const errorObj = errorToJSON(err)

      appStore.logsStore.logError(`Running scheduled operation\n${JSON.stringify(errorObj, null, 2)}`)

      if (attempts > this.retryLimit) {
        this.updateOperation(op, {
          status: 'failed',
          attempts,
          invokeAt: undefined,
          output: `Error: ${errorObj.message}`,
        })
      } else {
        this.updateOperation(op, {
          status: 'waiting',
          attempts,
          invokeAt: DateTime.local().plus({
            seconds: Math.max(2000, 2 ** attempts * 100),
          }),
          output: `Error: ${errorObj.message}`,
        })
      }
    }
  }

  private updateOperation(op, props) {
    appStore.operationsStore.update(op, props)
  }
}
