import classNames from 'classnames'
import React from 'react'

import { LotusForm } from './LotusForm'
import { PriceForm } from './PriceForm'
import { PriceTable } from './PriceTable'

export function Options({ className, ...rest }) {
  return (
    <div className={classNames(className, 'p-4')} {...rest}>
      <LotusForm />
      <PriceForm />
      <PriceTable />
    </div>
  )
}

