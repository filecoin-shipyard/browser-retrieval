import React from 'react';
import { useForm } from 'react-hook-form';
import useOptions from '../../../hooks/useOptions';
import Card from '../../../components/Card';
import Form from '../../../components/Form';
import InputField from '../../../components/InputField';

function PaymentForm(props) {
  const { handleSubmit, register, errors } = useForm();
  const [options, setOptionsGlobal] = useOptions();

  function onSubmit({ paymentInterval, paymentIntervalIncrease }) {
    setOptionsGlobal({
      paymentInterval: parseInt(paymentInterval, 10),
      paymentIntervalIncrease: parseInt(paymentIntervalIncrease, 10),
    });
  }

  return (
    <Card {...props}>
      <Form onSubmit={handleSubmit(onSubmit)}>
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
