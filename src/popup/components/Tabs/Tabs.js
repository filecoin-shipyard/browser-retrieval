import React, { useState } from 'react';
import classNames from 'classnames';

function Tabs({ tabs, children }) {
  const [currentTab, setCurrentTab] = useState(tabs[0]);
  const Component = currentTab.component;

  return (
    <div className="flex flex-col w-full h-full bg-gray-200 text-xs overflow-hidden">
      <ul className="flex items-center border-b border-gray-400 bg-white text-sm font-bold">
        {children}
        {tabs.map(tab => {
          const isActive = currentTab === tab;

          return (
            <li key={tab.label}>
              <button
                className={classNames(
                  'focus:outline-none border-b-4 border-transparent px-6 py-3 font-semibold',
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
