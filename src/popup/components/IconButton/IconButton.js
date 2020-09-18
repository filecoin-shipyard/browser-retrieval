import React from 'react';
import classNames from 'classnames';

const iconRenderers = {
  download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
      <path d="M12 21l-8-9h6v-12h4v12h6l-8 9zm9-1v2h-18v-2h-2v4h22v-4h-2z" />
    </svg>
  ),
  trash: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill-rule="evenodd"
      clip-rule="evenodd"
    >
      <path d="M19 24h-14c-1.104 0-2-.896-2-2v-16h18v16c0 1.104-.896 2-2 2zm-7-10.414l3.293-3.293 1.414 1.414-3.293 3.293 3.293 3.293-1.414 1.414-3.293-3.293-3.293 3.293-1.414-1.414 3.293-3.293-3.293-3.293 1.414-1.414 3.293 3.293zm10-8.586h-20v-2h6v-1.5c0-.827.673-1.5 1.5-1.5h5c.825 0 1.5.671 1.5 1.5v1.5h6v2zm-8-3h-4v1h4v-1z" />
    </svg>
  ),
  success: () => (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path fill-rule="evenodd"
            d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
    </svg>
  ),
};

function IconButton({ className, icon, danger, ...rest }) {
  return (
    <div
      className={classNames(
        className,
        'cursor-pointer transition-all duration-200',
        danger ? 'text-red hover:text-darkred' : 'text-brand hover:text-darkbrand',
      )}
      {...rest}
    >
      {iconRenderers[icon]()}
    </div>
  );
}

export default IconButton;
