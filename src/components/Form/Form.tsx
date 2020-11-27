import classNames from 'classnames'
import React from 'react'

import { BaseProps } from '../../shared/models/base-props'

export function Form({ className, ...rest }: BaseProps) {
  return <form className={classNames(className, 'flex p-4')} {...rest} />
}
