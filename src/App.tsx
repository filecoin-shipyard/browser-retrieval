import './styles/tailwind.css'

import { ConnectionIndicator } from 'App/ConnectionIndicator'
import { Editor } from 'App/Editor'
import { Home } from 'App/Home'
import { Logs } from 'App/Logs'
import { Options } from 'App/Options'
import { PeersIndicator } from 'App/PeersIndicator'
import { Toast } from 'App/Toast'
import { Upload } from 'App/Upload'
import { Tabs } from 'components/Tabs'
import { WalletModal } from 'components/WalletModal'
import React, { useEffect } from 'react'
import { OperationsQueue } from 'shared/OperationsQueue'
import { appStore } from 'shared/store/appStore'

const tabs = [
  {
    label: 'Home',
    component: Home,
  },
  {
    label: 'Options',
    component: Options,
  },
  {
    label: 'Logs',
    component: Logs,
  },
  {
    label: 'Import File',
    component: Upload,
  },
  {
    label: 'Automation',
    component: Editor,
  },
]

export function App() {
  useEffect(() => {
    if (!appStore.connected) {
      appStore.connect()

      // initialize operations loop
      OperationsQueue.create()
    }
  })

  return (
    <>
      <Toast />
      <Tabs className="text-xs text-black" tabs={tabs}>
        <li className="flex-1 px-4">Filecoin Retrieval</li>
        <li className="flex mr-8">
          <ConnectionIndicator />
          <PeersIndicator />
        </li>
      </Tabs>
      <WalletModal />
    </>
  )
}
