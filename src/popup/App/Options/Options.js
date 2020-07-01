import React from 'react';
import PortForm from './PortForm';
import PriceForm from './PriceForm';
import PriceTable from './PriceTable';

function Options() {
  return (
    <div className="p-4">
      <PortForm className="mb-4" />
      <PriceForm className="mb-4" />
      <PriceTable />
    </div>
  );
}

export default Options;
