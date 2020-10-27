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
      a[key] = JSON.parse(localStorage.getItem(key))

      return a
    }, {} as Record<string, Record<string, unknown>>)
  }

  set(data: Record<string, unknown>) {
    for (const key of Object.keys(data)) {
      localStorage[key] = data[key]
    }

    this.dispatchEvent(new Event(this.eventName))
  }
}

export const storage = new Storage()
