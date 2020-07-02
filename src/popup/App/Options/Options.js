import React from 'react';
import RendezvousForm from './RendezvousForm';
import PriceForm from './PriceForm';
import PriceTable from './PriceTable';

function Options() {
  return (
    <div className="p-4">
      <div className="flex mb-4">
        <RendezvousForm className="flex-grow mr-4" />
        <PriceForm className="flex-grow" />
      </div>
      <PriceTable />
    </div>
  );
}

export default Options;
