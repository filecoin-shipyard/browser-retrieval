import { toJS } from "mobx"
import { stringify } from "./stringify"

/**
 * Automatically saves the Mobx Store Class into localStorage. To use on class methods.
 * Requires that the class contain: private readonly localStorageKey = `_${this.constructor.name}`
 */
export const autosave = (_target: any, _key: string, descriptor: any) => {
  var originalMethod = descriptor.value

  descriptor.value = function (...args: any[]) {
    const ret = originalMethod.apply(this, args)
    localStorage.setItem(this.localStorageKey, stringify(toJS(this)))

    return ret
  }

  return descriptor
}
