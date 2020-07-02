import React from 'react';
import useOptions from 'src/popup/hooks/useOptions';
import Tabs from 'src/popup/components/Tabs';
import Options from './Options';
import Home from './Home';

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

  return <Tabs tabs={tabs} />;
}

export default App;
