import React from 'react';
import useOptions from 'src/hooks/useOptions';
import Tabs from 'src/components/Tabs';
import Options from './Options';
import './App.css';

const tabs = [
  {
    label: 'Home',
    component: 'div',
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
    <div className="App bg-gray-200 text-xs">
      <Tabs tabs={tabs} />
    </div>
  );
}

export default App;
