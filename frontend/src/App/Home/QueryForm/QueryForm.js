/* global chrome */

import React from 'react';
import { useForm } from 'react-hook-form';
import Card from '../../../components/Card';
import Form from '../../../components/Form';
import Label from '../../../components/Label';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import Error from '../../../components/Error';
import messageTypes from '../../../shared/messageTypes';

function QueryForm(props) {
  const { handleSubmit, register, errors } = useForm();

  function onSubmit({ cid }) {
    chrome.runtime.sendMessage({ messageType: messageTypes.query, cid });
  }

  return (
    <Card {...props}>
      <Form className="flex-col" onSubmit={handleSubmit(onSubmit)}>
        <Label className="mb-2">
          Query CID
        </Label>
        <div className="flex">
          <Input ref={register({ required: 'Required' })} name="cid" className="flex-1 mr-4" />
          <Button type="submit">Query</Button>
        </div>
        <Error className="mt-1" error={errors.cid} />
      </Form>
    </Card>
  );
}

export default QueryForm;
