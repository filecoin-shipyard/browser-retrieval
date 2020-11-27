import './Badge.css'

import classNames from 'classnames'
import React from 'react'
import { BaseProps } from 'shared/models/base-props'

export function Badge({ className, ...rest }: BaseProps) {
  return (
    <div
      className={classNames(
        className,
        'Badge absolute flex items-center justify-center px-1 h-3 leading-3 rounded bg-brand text-white',
      )}
      {...rest}
    />
  )
}
