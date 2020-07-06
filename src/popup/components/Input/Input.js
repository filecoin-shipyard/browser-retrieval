import React from 'react';
import classNames from 'classnames';

function Input({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={classNames(
        className,
        'appearance-none border border-border rounded w-full h-10 px-3 text-black leading-tight shadow focus:outline-none focus:border-brand focus:border-2 transition-all duration-200',
      )}
      {...rest}
    />
  );
}

export default React.forwardRef(Input);
