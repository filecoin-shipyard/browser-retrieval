import React from 'react';
import classNames from 'classnames';
import './Badge.css';

function Badge({ className, ...rest }) {
  return (
    <div
      className={classNames(
        className,
        'Badge absolute flex items-center justify-center px-1 h-3 rounded bg-brand text-white',
      )}
      {...rest}
    />
  );
}

export default Badge;
