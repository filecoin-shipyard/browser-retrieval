import React from 'react';
import classNames from 'classnames';

function IconButton({ className, danger, ...rest }) {
  return (
    <div
      className={classNames(
        className,
        'fill-current cursor-pointer',
        danger ? 'text-red-500' : 'text-blue-500',
      )}
      {...rest}
    />
  );
}

export default IconButton;
