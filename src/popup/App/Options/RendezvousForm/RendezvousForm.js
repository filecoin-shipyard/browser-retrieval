import React from 'react';
import { useForm } from 'react-hook-form';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import Form from 'src/popup/components/Form';
import InputField from 'src/popup/components/InputField';

function RendezvousForm(props) {
  const { handleSubmit, register, errors } = useForm();
  const [options, setOptions] = useOptions();

  async function onSubmit(data) {
    const aggregated = options.unsavedForms.payment || options.unsavedForms.price || options.unsavedForms.lotus;

    await setOptions({
      ...data, unsavedForms: {
        ...options.unsavedForms,
        rendezvous: false,
        unsaved: aggregated
      }
    });
  }

  function handleChange() {
    setOptions({
      unsavedForms: {
        ...options.unsavedForms,
        rendezvous: true,
      }
    });
  }

  return (
    <Card {...props} className={options.unsavedForms.rendezvous && options.unsaved ? 'border-2-blue mb-4' : 'mb-4'}>
      <Form onSubmit={handleSubmit(onSubmit)} onChange={handleChange}>
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
