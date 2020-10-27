import React from 'react';
import classNames from 'classnames';

function SubLabel({ className, ...rest }) {
  return <label className={classNames(className)} {...rest} />;
}

export default SubLabel;
