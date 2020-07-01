import React from 'react';
import classNames from 'classnames';

function TableRow({ className, head, ...rest }) {
  return <tr className={classNames(className, 'border-b', !head && 'last:border-b-0')} {...rest} />;
}

export default TableRow;
