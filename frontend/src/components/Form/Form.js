import React from 'react';
import classNames from 'classnames';

function Form({ className, ...rest }) {
  return <form className={classNames(className, 'flex p-4')} {...rest} />;
}

export default Form;
