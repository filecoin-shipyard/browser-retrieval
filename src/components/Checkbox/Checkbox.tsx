import classNames from 'classnames'
import React from 'react'

import { BaseProps } from 'shared/models/base-props'

function CheckboxRef({ className, ...rest }: BaseProps, ref) {
  return (
    <input
      ref={ref}
      type={'checkbox'}
      className={classNames(className, 'appearance-none border border-border rounded shadow w-1-25 h-1-25 mr-2')}
      {...rest}
    />
  )
}

export const Checkbox = React.forwardRef(CheckboxRef);
