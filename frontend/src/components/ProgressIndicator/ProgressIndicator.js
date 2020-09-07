import React from 'react';
import classNames from 'classnames';

function ProgressIndicator({ className, progress, ...rest }) {
  return (
    <div className={classNames(className, 'w-32 rounded bg-foreground overflow-hidden')} {...rest}>
      <div className="h-2 bg-green" style={{ width: `${progress * 100}%` }} />
    </div>
  );
}

export default ProgressIndicator;
