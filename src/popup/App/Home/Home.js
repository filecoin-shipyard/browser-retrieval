import React from 'react';
import classNames from 'classnames';
import QueryForm from './QueryForm';
import Logs from './Logs';

function Home({ className, ...rest }) {
  return (
    <div className={classNames(className, 'p-4')} {...rest}>
      <QueryForm className="mb-4" />
      <Logs />
    </div>
  );
}

export default Home;
