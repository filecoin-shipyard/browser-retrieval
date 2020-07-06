import React from 'react';
import classNames from 'classnames';

function Button({ className, ...rest }) {
  return (
    <button
      className={classNames(
        className,
        'h-10 rounded bg-brand px-6 text-white font-bold hover:bg-darkbrand transition-all duration-200',
      )}
      type="button"
      {...rest}
    />
  );
}

export default Button;
