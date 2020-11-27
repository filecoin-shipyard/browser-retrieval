import classNames from 'classnames'
import React from 'react'

function PreRef({ className, ...rest }, ref) {
  return (
    <pre
      ref={ref}
      className={classNames(
        className,
        'min-h-10 border border-border rounded bg-foreground p-2 font-mono overflow-x-auto',
      )}
      {...rest}
    />
  )
}

export const Pre = React.forwardRef(PreRef)
