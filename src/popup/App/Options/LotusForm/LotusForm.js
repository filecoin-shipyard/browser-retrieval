import React from 'react';
import { useForm } from 'react-hook-form';
import * as wasm from '@zondax/filecoin-signer-wasm';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import Form from 'src/popup/components/Form';
import InputField from 'src/popup/components/InputField';
import Label from 'src/popup/components/Label';
import Input from 'src/popup/components/Input';
import Button from 'src/popup/components/Button';
import Error from 'src/popup/components/Error';

function LotusForm(props) {
  const { handleSubmit, register, setError, errors } = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit(data) {
    const key = wasm.keyRecover(data.privateKey);

    if (key.address === data.wallet || key.address === data.wallet.replace(/^t/, 'f')) {
      setOptions(data);
    } else {
      setError('privateKey', { type: 'manual', message: "Wallet and private key don't match" });
    }
  }

  return (
    <Card {...props}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex mb-4">
          <InputField
            ref={register({ required: 'Required' })}
            className="flex-1 mr-4"
            label="My wallet"
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
          />
        </div>
        <Label className="mb-2" for="lotusEndpoint">
          Lotus endpoint
        </Label>
        <div className="flex">
          <Input
            ref={register({ required: 'Required' })}
            name="lotusEndpoint"
            className="flex-1 mr-4"
            defaultValue={options.lotusEndpoint}
          />
          <Button type="submit">Save</Button>
        </div>
        <Error className="mt-1" error={errors.lotusEndpoint} />
      </Form>
    </Card>
  );
}

export default LotusForm;
