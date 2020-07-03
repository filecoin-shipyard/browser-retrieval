import React from 'react';
import classNames from 'classnames';
import Upload from './Upload';
import KnownCids from './KnownCids';
import QueryForm from './QueryForm';
import Logs from './Logs';

function Home({ className, ...rest }) {
  return (
    <div className={classNames(className, 'p-4')} {...rest}>
      <Upload className="mb-4" />
      <KnownCids className="mb-4" />
      <QueryForm className="mb-4" />
      <Logs />
    </div>
  );
}

export default Home;
