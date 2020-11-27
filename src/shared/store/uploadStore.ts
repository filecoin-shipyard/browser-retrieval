import { makeAutoObservable } from 'mobx'

import { AppStore } from './appStore'

export class UploadStore {
  progress = 0

  constructor(private rootStore: AppStore) {
    makeAutoObservable(this)
  }

  upload(files) {
    // TODO: @brunolm implement
    console.log('upload files', files, typeof files)
    this.rootStore.node.uploadFiles(files)
  }

  setProgress(progress) {
    this.progress = progress
  }
}
