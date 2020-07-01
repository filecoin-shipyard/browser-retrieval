import React from 'react';
import useOptions from 'src/hooks/useOptions';
import Options from './Options';
import './App.css';

function App() {
  const [options] = useOptions();

  if (!options) {
    return null;
  }

  return (
    <div className="App bg-gray-200 text-xs">
      <Options />
    </div>
  );
}

export default App;
