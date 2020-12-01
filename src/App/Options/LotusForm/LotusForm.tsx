import { Card } from 'components/Card'
import { Form } from 'components/Form'
import { InputField } from 'components/InputField'
import { InputFieldPassword } from 'components/InputFieldPassword'
import React from 'react'
import { useForm } from 'react-hook-form'
import { appStore } from 'shared/store/appStore'

export function LotusForm(props) {
  const { handleSubmit, register, setError, errors } = useForm()
  const { optionsStore } = appStore

  async function onSubmit(data) {
    let key = { address: null }

    try {
      const signer = await import('@zondax/filecoin-signing-tools')
      key = signer.keyRecover(data.privateKey)
    } catch (e) {
      setError('privateKey', { type: 'manual', message: 'Private key length is invalid' })
    }

    const aggregated = optionsStore.unsavedForms.price

    if (key.address === data.wallet || key.address === data.wallet.replace(/^t/, 'f')) {
      optionsStore.set({
        ...data,
        unsavedForms: {
          ...optionsStore.unsavedForms,
          lotus: false,
        },
        unsaved: aggregated,
      })

      // reconnect after settings change
      await appStore.connect()
    } else {
      setError('privateKey', { type: 'manual', message: `Wallet and private key don't match` })
    }
  }

  function handleChange() {
    optionsStore.set({
      unsavedForms: {
        ...optionsStore.unsavedForms,
        lotus: true,
      },
    })
  }

  return (
    <Card
      {...props}
      className={optionsStore.unsavedForms.lotus && optionsStore.unsaved ? 'border-2-blue mb-4' : 'mb-4'}
    >
      <Form className="flex-col" onSubmit={handleSubmit(onSubmit)} onChange={handleChange}>
        <div className="flex">
          <InputField
            ref={register({ required: 'Required' })}
            className="flex-1 mr-4"
            label="Wallet"
            name="wallet"
            errors={errors}
            defaultValue={optionsStore.wallet}
          />
          <InputFieldPassword
            ref={register({ required: 'Required' })}
            className="flex-1"
            label="Private key (secp256k1)"
            name="privateKey"
            errors={errors}
            defaultValue={optionsStore.privateKey}
            submit
          />
        </div>
      </Form>
    </Card>
  )
}
