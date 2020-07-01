import React, { useState } from 'react';
import classNames from 'classnames';

function Tabs({ className, tabs, ...rest }) {
  const [currentTab, setCurrentTab] = useState(tabs[0]);
  const Component = currentTab.component;

  return (
    <div className={classNames(className)} {...rest}>
      <ul className="flex border-b border-gray-400 bg-white text-sm font-bold">
        <li className="flex-grow self-center px-4 text-blue-500">Filecoin Retrieval</li>
        {tabs.map(tab => {
          const isActive = currentTab === tab;

          return (
            <li key={tab.label} className={classNames(isActive && '-mb-px')}>
              <button
                className={classNames(
                  'focus:outline-none border-b-4 border-transparent p-4 pb-2 font-semibold',
                  isActive ? 'border-blue-700 text-blue-700' : 'text-gray-500 hover:text-gray-800',
                )}
                onClick={() => setCurrentTab(tab)}
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
