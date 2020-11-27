import classNames from 'classnames'
import React from 'react'

import { BaseProps } from 'shared/models/base-props'

export function Table({ className, ...rest }: BaseProps) {
  return <table className={classNames(className, 'w-full border-border border-b last:border-b-0')} {...rest} />
}
