import React, { useState } from 'react';
import classNames from 'classnames';

function Tabs({ className, tabs, children, ...rest }) {
  const [currentTab, setCurrentTab] = useState(tabs[0]);
  const Component = currentTab.component;

  return (
    <div
      className={classNames(className, 'flex flex-col w-full h-full bg-foreground overflow-hidden')}
      {...rest}
    >
      <ul className="flex items-center border-b border-border bg-white text-sm font-bold">
        {children}
        {tabs.map(tab => {
          const isActive = currentTab === tab;

          return (
            <li key={tab.label}>
              <button
                className={classNames(
                  'focus:outline-none border-b-4 px-6 py-3 font-semibold transition-all duration-200',
                  isActive
                    ? 'border-brand text-brand'
                    : 'border-transparent text-darkgray hover:text-black',
                )}
                onClick={() => setCurrentTab(tab)}
                type="button"
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
      <Component />
    </div>
  );
}

export default Tabs;
