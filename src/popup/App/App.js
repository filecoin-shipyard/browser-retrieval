/* global chrome */

import React from 'react';
import useOptions from 'src/popup/hooks/useOptions';
import Tabs from 'src/popup/components/Tabs';
import Home from './Home';
import Options from './Options';
import Logs from './Logs';
import Editor from './Editor';
import Upload from './Upload';
import ConnectionIndicator from './ConnectionIndicator';
import PeersIndicator from './PeersIndicator';
import messageTypes from 'src/shared/messageTypes';
import {getEnvironmentType} from 'src/shared/getEnvironmentType';
import {ENVIRONMENT_TYPE_FULLSCREEN} from 'src/shared/enums'

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
    label: 'Upload',
    component: Upload,
  },
  {
    label: 'Automation',
    component: Editor,
  },
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
    <Tabs className="text-xs text-black" tabs={tabs}>
      <li className="flex-1 px-4">Filecoin Retrieval</li>
      <li className="flex mr-8">
        <ConnectionIndicator />
        <PeersIndicator />
      </li>
    </Tabs>
  );
}

export default App;
