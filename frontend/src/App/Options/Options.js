import React from 'react';
import classNames from 'classnames';
import RendezvousForm from './RendezvousForm';
import LotusForm from './LotusForm';
import PaymentForm from './PaymentForm';
import PriceForm from './PriceForm';
import PriceTable from './PriceTable';

function Options({ className, ...rest }) {
  return (
    <div className={classNames(className, 'p-4')} {...rest}>
      <RendezvousForm className="mb-4" />
      <LotusForm className="mb-4" />
      <PaymentForm className="mb-4" />
      <PriceForm className="mb-4" />
      <PriceTable />
    </div>
  );
}

export default Options;
