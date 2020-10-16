import React from 'react';
import classNames from 'classnames';

function Checkbox({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      type={'checkbox'}
      className={classNames(
        className,
        'appearance-none border border-border rounded shadow w-1-25 h-1-25 mr-2'
      )}
      {...rest}
    />
  );
}

export default React.forwardRef(Checkbox);
