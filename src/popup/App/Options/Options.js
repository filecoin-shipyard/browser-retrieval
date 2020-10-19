import React from 'react';
import classNames from 'classnames';
import LotusForm from './LotusForm';
import PriceForm from './PriceForm';
import PriceTable from './PriceTable';

function Options({ className, ...rest }) {
  return (
    <div className={classNames(className, 'p-4')} {...rest}>
      <LotusForm />
      <PriceForm />
      <PriceTable />
    </div>
  );
}

export default Options;
