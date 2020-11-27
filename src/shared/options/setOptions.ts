import { storage } from 'shared/storage'

export const setOptions = (data) => {
  storage.set(data)
}
