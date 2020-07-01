import React from 'react';
import { useForm } from 'react-hook-form';
import useOptions from 'src/hooks/useOptions';

function PortForm() {
  const { handleSubmit, register, errors } = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit({ port }) {
    setOptions({ port: parseInt(port) });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>
        Port
        <input
          ref={register({ required: 'Required' })}
          name="port"
          type="number"
          defaultValue={options.port}
        />
        {errors.port && errors.port.message}
      </label>
      <input type="submit" value="Save" />
    </form>
  );
}

export default PortForm;
