import React from 'react';
import { useForm } from 'react-hook-form';
import useOptions from 'src/hooks/useOptions';
import Card from 'src/components/Card';
import Form from 'src/components/Form';
import InputField from 'src/components/InputField';
import Button from 'src/components/Button';

function PriceForm(props) {
  const { handleSubmit, register, errors } = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit({ cid, price }) {
    setOptions({
      pricePerByte: {
        ...options.pricePerByte,
        [cid]: parseFloat(price),
      },
    });
  }

  return (
    <Card {...props}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <InputField
          ref={register({ required: 'Required' })}
          label="CID"
          name="cid"
          errors={errors}
          type="text"
          defaultValue="*"
        />
        <InputField
          ref={register({ required: 'Required' })}
          label="Price/byte"
          name="price"
          errors={errors}
          type="number"
          min="0"
          step="any"
          defaultValue={options.pricePerByte['*'].toFixed(10)}
        />
        <Button className="self-end" type="submit">
          Save
        </Button>
      </Form>
    </Card>
  );
}

export default PriceForm;
