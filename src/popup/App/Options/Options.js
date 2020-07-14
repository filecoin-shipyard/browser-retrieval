import React from 'react';
import classNames from 'classnames';
import RendezvousForm from './RendezvousForm';
import PriceForm from './PriceForm';
import LotusForm from './LotusForm';
import PriceTable from './PriceTable';

function Options({ className, ...rest }) {
  return (
    <div className={classNames(className, 'p-4')} {...rest}>
      <div className="flex mb-4">
        <RendezvousForm className="flex-1 mr-4" />
        <PriceForm className="flex-1" />
      </div>
      <LotusForm className="mb-4" />
      <PriceTable />
    </div>
  );
}

export default Options;
