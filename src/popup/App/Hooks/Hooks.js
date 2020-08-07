import React from 'react';
import classNames from 'classnames';
import { useForm } from 'react-hook-form';
import { defaultOptions } from 'src/shared/getOptions';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import Form from 'src/popup/components/Form';
import Label from 'src/popup/components/Label';
import IconButton from 'src/popup/components/IconButton';
import Pre from 'src/popup/components/Pre';
import Error from 'src/popup/components/Error';
import Button from 'src/popup/components/Button';
import './Hooks.css';

function Hooks({ className, ...rest }) {
  const { handleSubmit, register, setValue, setError, errors } = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit(data) {
    try {
      // eslint-disable-next-line no-new-func
      new Function('cid', data.getDealParamsHook);
      setOptions(data);
    } catch (error) {
      setError('getDealParamsHook', { type: 'manual', message: `${error.name}: ${error.message}` });
    }
  }

  function resetFunction() {
    setValue('getDealParamsHook', defaultOptions.getDealParamsHook);
  }

  return (
    <div className={classNames(className, 'p-4')} {...rest}>
      <Card>
        <Form className="flex-col" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex">
            <Label className="flex-1 mb-2">Get deal params</Label>
            <IconButton icon="clear" onClick={resetFunction} />
          </div>
          <Pre className="Hooks--pre flex flex-col h-64 border rounded font-mono">
            <code class="p-2">{'function getDealParams(cid) {'}</code>
            <textarea
              ref={register({ required: 'Required' })}
              class="flex-1 p-2 pl-6 outline-none"
              name="getDealParamsHook"
              defaultValue={options.getDealParamsHook}
            />
            <code class="p-2">
              {'} // must return { pricePerByte, paymentInterval, paymentIntervalIncrease }'}
            </code>
          </Pre>
          <Error className="mt-1" error={errors.getDealParamsHook} />
          <Button className="self-end mt-4" type="submit">
            Save
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default Hooks;
