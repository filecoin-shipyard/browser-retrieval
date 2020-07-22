import React from 'react';
import { useForm } from 'react-hook-form';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import Form from 'src/popup/components/Form';
import InputField from 'src/popup/components/InputField';

function PriceForm(props) {
  const { handleSubmit, register, errors } = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit({ cid, price }) {
    setOptions({
      pricesPerByte: {
        ...options.pricesPerByte,
        [cid]: parseInt(price, 10),
      },
    });
  }

  return (
    <Card {...props}>
      <Form onSubmit={handleSubmit(onSubmit)}>
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
          defaultValue={options.pricesPerByte['*']}
          submit
        />
      </Form>
    </Card>
  );
}

export default PriceForm;
