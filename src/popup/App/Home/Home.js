import React from 'react';
import classNames from 'classnames';
import ListeningState from './ListeningState';
import Peers from './Peers';
import QueryForm from './QueryForm';
import Logs from './Logs';

function Home({ className, ...rest }) {
  return (
    <div className={classNames(className, 'p-4')} {...rest}>
      <ListeningState className="mb-4" />
      <Peers className="mb-4" />
      <QueryForm className="mb-4" />
      <Logs />
    </div>
  );
}

export default Home;
