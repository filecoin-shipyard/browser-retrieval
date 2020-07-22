import React from 'react';
import useOptions from 'src/popup/hooks/useOptions';
import Tabs from 'src/popup/components/Tabs';
import Home from './Home';
import Options from './Options';
import Logs from './Logs';
import ConnectionIndicator from './ConnectionIndicator';
import PeersIndicator from './PeersIndicator';

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
];

function App() {
  const [options] = useOptions();

  if (!options) {
    return null;
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
