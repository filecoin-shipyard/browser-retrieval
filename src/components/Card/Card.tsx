import classNames from 'classnames'
import React from 'react'

import { BaseProps } from 'shared/models/base-props'

export function Card({ className, ...rest }: BaseProps) {
  return <div className={classNames(className, 'flex flex-col rounded bg-white shadow-md')} {...rest} />
}
