import React from 'react';
import classNames from 'classnames';

function Label({ className, ...rest }) {
  return <label className={classNames(className, 'font-bold')} {...rest} />;
}

export default Label;
