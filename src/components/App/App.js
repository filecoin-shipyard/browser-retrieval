import React from 'react';
import Options from 'src/components/Options';
import useOptions from 'src/hooks/useOptions';

function App() {
  const [options] = useOptions();

  if (!options) {
    return null;
  }

  return <Options />;
}

export default App;
