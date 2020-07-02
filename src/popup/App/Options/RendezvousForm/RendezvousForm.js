import React from 'react';
import { useForm } from 'react-hook-form';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import Form from 'src/popup/components/Form';
import InputField from 'src/popup/components/InputField';
import Button from 'src/popup/components/Button';

function RendezvousForm(props) {
  const { handleSubmit, register, errors } = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit(data, ...args) {
    setOptions(data);
  }

  return (
    <Card {...props}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex mb-4">
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
          />
        </div>
        <Button className="self-end" type="submit">
          Save
        </Button>
      </Form>
    </Card>
  );
}

export default RendezvousForm;
