import React from 'react';
import classNames from 'classnames';

function Error({ className, error, ...rest }) {
  if (!error) {
    return null;
  }

  return (
    <div className={classNames(className, 'text-red text-xs italic')} {...rest}>
      {error.message}
    </div>
  );
}

export default Error;
