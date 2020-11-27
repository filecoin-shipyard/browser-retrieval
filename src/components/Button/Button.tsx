import classNames from 'classnames'
import React from 'react'

import { BaseProps } from 'shared/models/base-props'

export function Button({ className, ...rest }: BaseProps) {
  return (
    <button
      className={classNames(
        className,
        'h-10 rounded bg-brand px-6 text-white font-bold hover:bg-darkbrand transition-all duration-200',
      )}
      type="button"
      {...rest}
    />
  )
}
