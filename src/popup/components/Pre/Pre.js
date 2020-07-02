import React from 'react';
import classNames from 'classnames';

function Pre({ className, ...rest }) {
  return (
    <pre
      className={classNames(className, 'border rounded bg-gray-100 p-2 font-mono overflow-x-auto')}
      {...rest}
    />
  );
}

export default Pre;
