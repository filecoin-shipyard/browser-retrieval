import React from 'react';
import classNames from 'classnames';

function TableCell({ className, head, large, number, buttons, ...rest }) {
  const Component = head ? 'th' : 'td';

  return (
    <Component
      className={classNames(
        className,
        'px-3 first:pl-6 last:pr-6',
        head && 'font-normal text-gray-500 uppercase',
        large && 'truncate w-full max-w-1',
        number ? 'text-right' : 'text-left',
        buttons ? 'w-1p' : 'py-2',
      )}
      {...rest}
    />
  );
}

export default TableCell;
