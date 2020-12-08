import classNames from 'classnames'
import { Form } from 'components/Form'
import { InputField } from 'components/InputField'
import { InputFieldPassword } from 'components/InputFieldPassword'
import { Label } from 'components/Label'
import { appStore } from 'shared/store/appStore'
import React from 'react'
import { useForm } from 'react-hook-form'

import { BaseProps } from '../../shared/models/base-props'

export function WalletModal({ className, ...rest }: BaseProps) {
  const { handleSubmit, register, setError, errors } = useForm()
  const { optionsStore } = appStore

  if (optionsStore && optionsStore.wallet && optionsStore.privateKey) {
    return null
  }

  async function onSubmit(data) {
    let key = { address: null }

    try {
      const signer = await import('@zondax/filecoin-signing-tools')

      key = signer.keyRecover(data.privateKey)
    } catch (err) {
      console.error('err', err)
      setError('privateKey', { type: 'manual', message: 'Private key length is invalid' })
    }

    if (key.address === data.wallet || key.address === data.wallet.replace(/^t/, 'f')) {
      optionsStore.set({
        ...data,
      })

      await appStore.connect();
    } else {
      setError('privateKey', { type: 'manual', message: `Wallet and private key don't match` })
    }
  }

  return (
    <div className={classNames(className, 'wallet-modal relative mx-2')} {...rest}>
      <div className="fixed inset-0 flex items-center justify-center z-10">
        <div className="absolute inset-0 bg-black opacity-50" />
        <div
          className="relative flex-1 m-8 min-w-0 rounded bg-white p-4 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <Label className="ml-4">
            Before you can start using this tool, you must supply a wallet address and base64 private key.
          </Label>
          <Form className="flex-col" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex">
              <InputField
                ref={register({ required: 'Required' })}
                className="flex-1 mr-4"
                label="Wallet"
                name="wallet"
                errors={errors}
                defaultValue={optionsStore.wallet}
                placeholder={optionsStore.walletPlaceholder}
                onFocus={(e) => (e.target.placeholder = '')}
                onBlur={(e) => (e.target.placeholder = optionsStore.walletPlaceholder)}
              />
              <InputFieldPassword
                ref={register({ required: 'Required' })}
                className="flex-1"
                label="Private key (secp256k1)"
                name="privateKey"
                errors={errors}
                defaultValue={optionsStore.privateKey}
                placeholder={optionsStore.privateKeyPlaceholder}
                onFocus={(e) => (e.target.placeholder = '')}
                onBlur={(e) => (e.target.placeholder = optionsStore.privateKeyPlaceholder)}
                submit
              />
            </div>
          </Form>
        </div>
      </div>
    </div>
  )
}
