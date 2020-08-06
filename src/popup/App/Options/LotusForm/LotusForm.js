import React from 'react';
import { useForm } from 'react-hook-form';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import Form from 'src/popup/components/Form';
import InputField from 'src/popup/components/InputField';

function LotusForm(props) {
  const { handleSubmit, register, errors } = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit(data) {
    setOptions(data);
  }

  return (
    <Card {...props}>
      <Form className="flex-col" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex mb-4">
          <InputField
            ref={register({ required: 'Required' })}
            className="flex-1 mr-4"
            label="Lotus endpoint"
            name="lotusEndpoint"
            errors={errors}
            defaultValue={options.lotusEndpoint}
          />
          <InputField
            ref={register({ required: 'Required' })}
            className="flex-1"
            label="JWT token"
            name="lotusToken"
            errors={errors}
            defaultValue={options.lotusToken}
          />
        </div>
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
            submit
          />
        </div>
      </Form>
    </Card>
  );
}

export default LotusForm;
