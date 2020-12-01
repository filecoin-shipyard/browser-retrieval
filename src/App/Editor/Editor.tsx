import './Editor.css'

import classNames from 'classnames'
import { Button } from 'components/Button'
import { Card } from 'components/Card'
import { Error } from 'components/Error'
import { Form } from 'components/Form'
import { Label } from 'components/Label'
import { TextArea } from 'components/TextArea'
import React from 'react'
import { useForm } from 'react-hook-form'
import { appStore } from 'shared/store/appStore'

export const Editor = ({ className, ...rest }) => {
  const { handleSubmit, register, errors } = useForm()

  const { optionsStore } = appStore
  const { automationCode } = optionsStore

  function onSubmit({ automationCode }) {
    optionsStore.set({ automationCode })

    console.log('TODO: @brunolm')
    // TODO: @brunolm
    // chrome.runtime.sendMessage({ messageType: messageTypes.automationStart, data })
  }

  function onBlur() {
    console.log('TODO: @brunolm')
    // TODO: @brunolm
    // chrome.runtime.sendMessage({ messageType: messageTypes.automationStop })
  }

  return (
    <div className={classNames(className, 'p-4')} {...rest} onBlur={onBlur}>
      <Card className="p-4">
        <Form className="flex-col" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex">
            <Label className="flex-1 mb-2">Automation code</Label>
          </div>
          <TextArea
            ref={register({ required: 'Required' })}
            className="Editor--textarea"
            name="automationCode"
            defaultValue={automationCode}
          />
          <Error className="mt-1" error={errors.automationCode} />
          <Button className="w-32 mt-4" type="submit">
            Save
          </Button>
        </Form>
      </Card>
    </div>
  )
}
