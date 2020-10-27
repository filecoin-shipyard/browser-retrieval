/* global chrome */
import React from 'react';
import Tabs from 'src/popup/components/Tabs';
import useOptions from 'src/popup/hooks/useOptions';
import { ENVIRONMENT_TYPE_FULLSCREEN } from 'src/shared/enums';
import { getEnvironmentType } from 'src/shared/getEnvironmentType';
import messageTypes from 'src/shared/messageTypes';

import ConnectionIndicator from './ConnectionIndicator';
import Editor from './Editor';
import Home from './Home';
import Logs from './Logs';
import Options from './Options';
import PeersIndicator from './PeersIndicator';
import Toast from './Toast';
import Upload from './Upload';

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
//  {
//    label: 'Automation',
//    component: Editor,
//  },
];

function App() {
  const [options] = useOptions();

  if (!options) {
    return null;
  }

  if (getEnvironmentType() !== ENVIRONMENT_TYPE_FULLSCREEN) {
    chrome.runtime.sendMessage({ messageType: messageTypes.openExtensionInBrowser });
    window.close();
  }

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
    </>
  );
}

export default App;
