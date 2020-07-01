import React from 'react';
import classNames from 'classnames';

function Card({ className, ...rest }) {
  return (
    <div className={classNames(className, 'flex flex-col rounded bg-white shadow-md')} {...rest} />
  );
}

export default Card;
