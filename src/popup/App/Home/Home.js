import React from 'react';
import ListeningState from './ListeningState';
import PeersState from './PeersState';

function Home() {
  return (
    <div className="p-4">
      <ListeningState className="mb-4" />
      <PeersState />
    </div>
  );
}

export default Home;
