import classNames from 'classnames'
import React from 'react'
import { BaseProps } from 'shared/models/base-props'

export function TableRow({ className, head, ...rest }: BaseProps) {
  return <tr className={classNames(className, !head && 'border-border border-t')} {...rest} />
}
