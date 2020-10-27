import { storage } from '../storage'

export const setOptions = (data) => {
  storage.set(data)
}
