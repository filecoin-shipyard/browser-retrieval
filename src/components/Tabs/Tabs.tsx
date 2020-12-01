import classNames from 'classnames'
import { Label } from 'components/Label'
import { appStore } from 'shared/store/appStore'
import React, { useState } from 'react'
import { BaseProps } from 'shared/models/base-props'

export function Tabs({ className, tabs, children, ...rest }: BaseProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState(tabs[0])
  const Component = currentTab.component
  const { optionsStore } = appStore

  function toggleIsOpen() {
    setIsOpen(!isOpen)
  }

  function switchTab(tab) {
    const aggregated = optionsStore.unsavedForms.price || optionsStore.unsavedForms.lotus

    if (aggregated && tab.label !== 'Options') {
      setIsOpen(true)

      optionsStore.set({ unsaved: true })
    } else {
      setCurrentTab(tab)
    }
  }

  return (
    <div className={classNames(className, 'flex flex-col w-full h-full bg-foreground overflow-hidden')} {...rest}>
      <ul className="flex items-center border-b border-border bg-white text-sm font-bold">
        {children}
        {tabs.map((tab) => {
          const isActive = currentTab === tab

          return (
            <li key={tab.label}>
              <button
                className={classNames(
                  'focus:outline-none border-b-4 px-6 py-3 font-semibold transition-all duration-200',
                  isActive ? 'border-brand text-brand' : 'border-transparent text-darkgray hover:text-black',
                )}
                onClick={() => switchTab(tab)}
                type="button"
              >
                {tab.label}
              </button>
            </li>
          )
        })}
      </ul>
      <Component />
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-10" onClick={toggleIsOpen}>
          <div className="absolute inset-0 bg-black opacity-50" />
          <div
            className="relative flex-1 m-8 min-w-0 rounded bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Label>You have unsaved values in the Options fields. Please press Save to set those values.</Label>
          </div>
        </div>
      )}
    </div>
  )
}
