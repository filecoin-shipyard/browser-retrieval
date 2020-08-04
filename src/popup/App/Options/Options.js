import React from 'react';
import classNames from 'classnames';
import RendezvousForm from './RendezvousForm';
import LotusForm from './LotusForm';

function Options({ className, ...rest }) {
  return (
    <div className={classNames(className, 'p-4')} {...rest}>
      <RendezvousForm className="mb-4" />
      <LotusForm />
    </div>
  );
}

export default Options;
