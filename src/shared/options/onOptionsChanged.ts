import { storage } from '../storage'

export const onOptionsChanged = (callback) => {
  storage.subscribe(callback)

  return () => {
    storage.unsubscribe(callback)
  }
}
