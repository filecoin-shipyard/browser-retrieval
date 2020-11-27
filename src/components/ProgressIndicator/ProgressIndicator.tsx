import classNames from 'classnames'
import React from 'react'
import { BaseProps } from 'shared/models/base-props'

export function ProgressIndicator({ className, progress, ...rest }: BaseProps) {
  return (
    <div className={classNames(className, 'w-32 rounded bg-foreground overflow-hidden')} {...rest}>
      <div className="h-2 bg-green" style={{ width: `${progress * 100}%` }} />
    </div>
  )
}
