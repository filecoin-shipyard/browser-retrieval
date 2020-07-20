import React from 'react';
import classNames from 'classnames';

function Pre({ className, ...rest }, ref) {
  return (
    <pre
      ref={ref}
      className={classNames(
        className,
        'min-h-10 border border-border rounded bg-foreground p-2 font-mono overflow-x-auto',
      )}
      {...rest}
    />
  );
}

export default React.forwardRef(Pre);
