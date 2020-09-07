import React from 'react';
import { useForm } from 'react-hook-form';
import useOptions from '../../../hooks/useOptions';
import Card from '../../../components/Card';
import Form from '../../../components/Form';
import InputField from '../../../components/InputField';

function RendezvousForm(props) {
  const { handleSubmit, register, errors } = useForm();
  const [options, setOptionsGlobal] = useOptions();

  async function onSubmit(data) {
    await setOptionsGlobal(data);
  }

  return (
    <Card {...props}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <InputField
          ref={register({ required: 'Required' })}
          className="flex-1 mr-4"
          label="Rendezvous IP"
          name="rendezvousIp"
          errors={errors}
          defaultValue={options.rendezvousIp}
        />
        <InputField
          ref={register({ required: 'Required' })}
          className="flex-1"
          label="Rendezvous port"
          name="rendezvousPort"
          errors={errors}
          defaultValue={options.rendezvousPort}
          submit
        />
      </Form>
    </Card>
  );
}

export default RendezvousForm;
