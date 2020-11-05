import React from 'react';
import { useForm } from 'react-hook-form';
import * as signer from '@zondax/filecoin-signing-tools';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import Form from 'src/popup/components/Form';
import InputField from 'src/popup/components/InputField';

function LotusForm(props) {
  const { handleSubmit, register, setError, errors } = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit(data) {
    const key = signer.keyRecover(data.privateKey);
    const aggregated = options.unsavedForms.price;

    if (key.address === data.wallet || key.address === data.wallet.replace(/^t/, 'f')) {
      setOptions({
        ...data, unsavedForms: {
          ...options.unsavedForms,
          lotus: false,
        }, unsaved: aggregated,
      });
    } else {
      setError('privateKey', { type: 'manual', message: "Wallet and private key don't match" });
    }
  }

  function handleChange() {
    setOptions({
      unsavedForms: {
        ...options.unsavedForms,
        lotus: true,
      }
    });
  }

  return (
    <Card {...props} className={options.unsavedForms.lotus && options.unsaved ? 'border-2-blue mb-4' : 'mb-4'}>
      <Form className="flex-col" onSubmit={handleSubmit(onSubmit)} onChange={handleChange}>
        <div className="flex">
          <InputField
            ref={register({ required: 'Required' })}
            className="flex-1 mr-4"
            label="Wallet"
            name="wallet"
            errors={errors}
            defaultValue={options.wallet}
          />
          <InputField
            ref={register({ required: 'Required' })}
            className="flex-1"
            label="Private key (secp256k1)"
            name="privateKey"
            errors={errors}
            defaultValue={options.privateKey}
            type="password"
            submit
          />
        </div>
      </Form>
    </Card>
  );
}

export default LotusForm;
