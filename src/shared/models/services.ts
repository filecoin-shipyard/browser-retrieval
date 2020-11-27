import { Datastore } from 'shared/Datastore'

import { AppStore } from '../store/appStore'

export interface Services {
  datastore?: Datastore

  appStore?: AppStore
}
