import classNames from 'classnames'
import React from 'react'
import { BaseProps } from 'shared/models/base-props'

export function Error({ className, error, ...rest }: BaseProps) {
  if (!error) {
    return null
  }

  return (
    <div className={classNames(className, 'text-red text-xs italic')} {...rest}>
      {error.message}
    </div>
  )
}
