import classNames from 'classnames'
import React from 'react'
import { BaseProps } from 'shared/models/base-props'

export function TextAreaRef({ className, ...rest }: BaseProps, ref) {
  return (
    <textarea
      ref={ref}
      className={classNames(
        className,
        'min-h-10 border border-border rounded bg-foreground p-2 font-mono overflow-x-auto',
      )}
      {...rest}
    />
  )
}

export const TextArea = React.forwardRef(TextAreaRef)
