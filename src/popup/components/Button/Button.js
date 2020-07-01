import React from 'react';
import classNames from 'classnames';

function Button({ className, ...rest }) {
  return (
    <button
      className={classNames(
        className,
        'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
      )}
      type="button"
      {...rest}
    />
  );
}

export default Button;
