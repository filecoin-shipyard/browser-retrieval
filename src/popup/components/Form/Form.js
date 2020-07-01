import React from 'react';
import classNames from 'classnames';

function Form({ className, ...rest }) {
  return <form className={classNames(className, 'flex flex-col p-4')} {...rest} />;
}

export default Form;
