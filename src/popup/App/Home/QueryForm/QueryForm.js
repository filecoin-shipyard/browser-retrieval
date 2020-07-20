/* global chrome */

import React from 'react';
import { useForm } from 'react-hook-form';
import Card from 'src/popup/components/Card';
import Form from 'src/popup/components/Form';
import Label from 'src/popup/components/Label';
import Input from 'src/popup/components/Input';
import Button from 'src/popup/components/Button';
import Error from 'src/popup/components/Error';
import messageTypes from 'src/shared/messageTypes';

function QueryForm(props) {
  const { handleSubmit, register, errors } = useForm();

  function onSubmit({ cid }) {
    chrome.runtime.sendMessage({ messageType: messageTypes.query, cid });
  }

  return (
    <Card {...props}>
      <Form className="flex-col" onSubmit={handleSubmit(onSubmit)}>
        <Label className="mb-2" for="cid">
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
