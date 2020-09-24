import React from 'react';
import { useForm } from 'react-hook-form';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import Form from 'src/popup/components/Form';
import InputField from 'src/popup/components/InputField';

function PaymentForm(props) {
  const { handleSubmit, register, errors } = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit({ paymentInterval, paymentIntervalIncrease }) {
    setOptions({
      paymentInterval: parseInt(paymentInterval, 10),
      paymentIntervalIncrease: parseInt(paymentIntervalIncrease, 10),
      unsaved: false
    });
  }

  function handleChange() {
    setOptions({unsaved: true});
  }

  return (
    <Card {...props}>
      <Form onSubmit={handleSubmit(onSubmit)} onChange={handleChange}>
        <InputField
          ref={register({ required: 'Required' })}
          className="flex-1 mr-4"
          label="Payment interval (ms)"
          name="paymentInterval"
          errors={errors}
          type="number"
          min="0"
          step="1"
          defaultValue={options.paymentInterval}
        />
        <InputField
          ref={register({ required: 'Required' })}
          className="flex-1"
          label="Interval increase (bytes)"
          name="paymentIntervalIncrease"
          errors={errors}
          type="number"
          min="0"
          step="1"
          defaultValue={options.paymentIntervalIncrease}
          submit
        />
      </Form>
    </Card>
  );
}

export default PaymentForm;
