import React from 'react';
import classNames from 'classnames';

function TableRow({ className, head, ...rest }) {
  return <tr className={classNames(className, !head && 'border-border border-t')} {...rest} />;
}

export default TableRow;
