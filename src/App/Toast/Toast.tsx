import './Toast.css'

import classNames from 'classnames'
import { appStore } from 'shared/store/appStore'
import React from 'react'
import { BaseProps } from 'shared/models/base-props'

export function Toast({ className, ...rest }: BaseProps) {
  const { alertsStore } = appStore

  const { alerts } = alertsStore

  if (!alerts?.length) {
    return null
  }

  const dismiss = (id) => {
    alertsStore.dismiss(id)
  }

  return (
    <div className={classNames(className, 'p-4 toast')} {...rest}>
      {alerts.map((msg) => (
        <div key={msg.id} className={classNames(msg.type, 'toast-item error-width')}>
          <div>{msg.message}</div>
          <button className="dismiss" onClick={() => dismiss(msg.id)}>
            dismiss
          </button>
        </div>
      ))}
    </div>
  )
}
