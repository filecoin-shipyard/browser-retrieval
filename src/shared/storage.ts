class Storage extends EventTarget {
  readonly eventName = 'localStorageChanged'

  subscribe(fn: EventListenerOrEventListenerObject) {
    this.addEventListener(this.eventName, fn)
  }

  unsubscribe(fn) {
    this.removeEventListener(this.eventName, fn)
  }

  get() {
    const keys = Object.keys(localStorage)

    return keys.reduce((a, key) => {
      const val = localStorage.getItem(key)
      a[key] = this.parse(val)

      return a
    }, {} as Record<string, Record<string, unknown>>)
  }

  set(data: Record<string, unknown>) {
    for (const key of Object.keys(data)) {
      localStorage[key] = this._isObject(data[key]) ? JSON.stringify(data[key]) : data[key]
    }

    // TODO: @brunolm migrate
    this.dispatchEvent(new Event(this.eventName))
  }

  parse(val) {
    try {
      return JSON.parse(val)
    } catch (err) {
      return val
    }
  }

  _isObject(val) {
    return typeof val === 'object' && val !== null
  }
}

export const storage = new Storage()
