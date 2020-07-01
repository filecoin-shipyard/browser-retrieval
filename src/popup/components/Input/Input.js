import React from 'react';
import classNames from 'classnames';

function Input({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={classNames(
        className,
        'appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
      )}
      {...rest}
    />
  );
}

export default React.forwardRef(Input);
