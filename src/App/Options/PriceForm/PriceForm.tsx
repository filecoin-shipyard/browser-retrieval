import { Card } from 'components/Card'
import { Form } from 'components/Form'
import { InputField } from 'components/InputField'
import { appStore } from 'shared/store/appStore'
import React from 'react'
import { useForm } from 'react-hook-form'

export function PriceForm(props) {
  const { handleSubmit, register, errors } = useForm()
  const { optionsStore } = appStore

  function onSubmit(values) {
    const aggregated = optionsStore.unsavedForms.lotus

    const { cid, price } = values

    optionsStore.set({
      pricesPerByte: {
        ...optionsStore.pricesPerByte,
        [cid]: parseInt(price, 10),
      },
      unsavedForms: {
        ...optionsStore.unsavedForms,
        price: false,
      },
      unsaved: aggregated,
    })
  }

  function handleChange() {
    optionsStore.set({
      unsavedForms: {
        ...optionsStore.unsavedForms,
        price: true,
      },
    })
  }

  return (
    <Card
      {...props}
      className={optionsStore.unsavedForms.price && optionsStore.unsaved ? 'border-2-blue mb-4' : 'mb-4'}
    >
      <Form onSubmit={handleSubmit(onSubmit)} onChange={handleChange}>
        <InputField
          ref={register({ required: 'Required' })}
          className="flex-1 mr-4"
          label="CID"
          name="cid"
          errors={errors}
          defaultValue="*"
        />
        <InputField
          ref={register({ required: 'Required' })}
          className="flex-1"
          label="Price/byte (AttoFIL)"
          name="price"
          errors={errors}
          type="number"
          min="0"
          step="1"
          defaultValue={optionsStore.pricesPerByte['*']}
          submit
        />
      </Form>
    </Card>
  )
}
