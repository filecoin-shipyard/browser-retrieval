import './Home.css'

import classNames from 'classnames'
import React from 'react'

import { Deals } from './Deals'
import { KnownCids } from './KnownCids'
import { Offers } from './Offers'
import { OperationsList } from './OperationsList'
import { QueryForm } from './QueryForm'
import { RecentCids } from './RecentCids'

export const Home = ({ className, ...rest }) => {
  return (
    <div className={classNames(className, 'p-4 main-page flex items-start justify-start')} {...rest}>
      <div className="main">
        <QueryForm />
        <Offers className="mt-4" />
        <KnownCids className="mt-4" />
        <Deals className="mt-4" />
        <OperationsList className="mt-4" />
      </div>
      <div className="side">
        <RecentCids />
      </div>
    </div>
  )
}
