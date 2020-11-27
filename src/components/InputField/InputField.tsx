import classNames from 'classnames'
import { Button } from 'components/Button'
import { Error } from 'components/Error'
import { Input } from 'components/Input'
import { Label } from 'components/Label'
import React from 'react'

function InputFieldRef({ className, label, name, submit, errors, ...rest }, ref) {
  return (
    <div className={classNames(className, 'flex flex-col')}>
      <Label className="mb-2" htmlFor={name}>
        {label}
      </Label>
      <div className="flex">
        <Input ref={ref} className="flex-1" name={name} {...rest} />
        {submit && (
          <Button className="ml-4" type="submit">
            Save
          </Button>
        )}
      </div>
      <Error className="mt-1" error={errors[name]} />
    </div>
  )
}

export const InputField = React.forwardRef(InputFieldRef)
