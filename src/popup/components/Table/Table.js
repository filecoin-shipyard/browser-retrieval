import React from 'react';
import classNames from 'classnames';

function Table({ className, ...rest }) {
  return (
    <table
      className={classNames(className, 'w-full border-border border-b last:border-b-0')}
      {...rest}
    />
  );
}

export default Table;
