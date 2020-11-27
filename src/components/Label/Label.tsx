import classNames from 'classnames'
import React from 'react'
import { BaseProps } from 'shared/models/base-props'

export function Label({ className, ...rest }: BaseProps) {
  return <label className={classNames(className, 'font-bold')} {...rest} />
}
