import React from 'react';
import { useForm } from 'react-hook-form';
import useOptions from 'src/hooks/useOptions';
import Card from 'src/components/Card';
import Form from 'src/components/Form';
import InputField from 'src/components/InputField';
import Button from 'src/components/Button';

function PortForm(props) {
  const { handleSubmit, register, errors } = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit({ port }) {
    setOptions({ port: parseInt(port) });
  }

  return (
    <Card {...props}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <InputField
          ref={register({ required: 'Required' })}
          label="Port"
          name="port"
          errors={errors}
          type="number"
          defaultValue={options.port}
        />
        <Button className="self-end" type="submit">
          Save
        </Button>
      </Form>
    </Card>
  );
}

export default PortForm;
