import classNames from 'classnames';
import React from 'react';

import Deals from './Deals';
import KnownCids from './KnownCids';
import Offers from './Offers';
import QueryForm from './QueryForm';

function Home({ className, ...rest }) {
  return (
    <div className={classNames(className, 'p-4')} {...rest}>
      <QueryForm />
      <Offers className="mt-4" />
      <KnownCids className="mt-4" />
      <Deals className="mt-4" />
    </div>
  );
}

export default Home;
