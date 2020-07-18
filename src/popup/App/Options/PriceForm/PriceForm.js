import React from 'react';
import { useForm } from 'react-hook-form';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import Form from 'src/popup/components/Form';
import InputField from 'src/popup/components/InputField';
import Button from 'src/popup/components/Button';

function PriceForm(props) {
  const { handleSubmit, register, errors } = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit({ cid, price }) {
    setOptions({
      pricesPerByte: {
        ...options.pricesPerByte,
        [cid]: parseInt(price),
      },
    });
  }

  return (
    <Card {...props}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex mb-4">
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
            label="Price/byte"
            name="price"
            errors={errors}
            type="number"
            min="0"
            step="1"
            defaultValue={options.pricesPerByte['*']}
          />
        </div>
        <Button className="self-end" type="submit">
          Set
        </Button>
      </Form>
    </Card>
  );
}

export default PriceForm;
