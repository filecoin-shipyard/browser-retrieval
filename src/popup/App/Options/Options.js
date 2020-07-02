import React from 'react';
import RendezvousForm from './RendezvousForm';
import PriceForm from './PriceForm';
import PriceTable from './PriceTable';

function Options() {
  return (
    <div className="p-4">
      <RendezvousForm className="mb-4" />
      <PriceForm className="mb-4" />
      <PriceTable />
    </div>
  );
}

export default Options;
