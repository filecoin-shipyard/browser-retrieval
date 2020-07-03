import React from 'react';
import useOptions from 'src/popup/hooks/useOptions';
import Tabs from 'src/popup/components/Tabs';
import Options from './Options';
import Home from './Home';
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
];

function App() {
  const [options] = useOptions();

  if (!options) {
    return null;
  }

  return (
    <Tabs tabs={tabs}>
      <li className="flex-grow px-4 text-blue-500">Filecoin Retrieval</li>
      <li className="flex mr-8">
        <ConnectionIndicator />
        <PeersIndicator />
      </li>
    </Tabs>
  );
}

export default App;
