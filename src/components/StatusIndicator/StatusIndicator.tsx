import classNames from 'classnames'
import React, { useState } from 'react'
import { Badge } from 'components/Badge'
import { Label } from 'components/Label'
import { Pre } from 'components/Pre'

export function StatusIndicator({ className, icon, badge, label, description, ...rest }: any) {
  const [isOpen, setIsOpen] = useState(false)

  function toggleIsOpen() {
    setIsOpen(!isOpen)
  }

  return (
    <div className={classNames(className, 'relative mx-2')} {...rest}>
      <button type="button" className="focus:outline-none" onClick={toggleIsOpen}>
        {icon}
        {badge !== undefined && <Badge>{badge}</Badge>}
      </button>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-10" onClick={toggleIsOpen}>
          <div className="absolute inset-0 bg-black opacity-50" />
          <div
            className="relative flex-1 m-8 min-w-0 rounded bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Label>{label}</Label>
            {description && <Pre className="mt-2">{description}</Pre>}
          </div>
        </div>
      )}
    </div>
  )
}
