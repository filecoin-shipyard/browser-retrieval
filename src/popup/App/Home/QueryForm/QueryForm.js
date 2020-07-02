/* global chrome */

import React from 'react';
import { useForm } from 'react-hook-form';
import Card from 'src/popup/components/Card';
import Form from 'src/popup/components/Form';
import InputField from 'src/popup/components/InputField';
import Button from 'src/popup/components/Button';
import filecoinRetrieval from 'src/shared/filecoinRetrieval';

function QueryForm(props) {
  const { handleSubmit, register, errors } = useForm();

  function onSubmit({ cid }) {
    chrome.runtime.sendMessage({ messageType: filecoinRetrieval.messageType.query, cid });
  }

  return (
    <Card {...props}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-end">
          <InputField
            ref={register({ required: 'Required' })}
            className="flex-1 mr-4"
            label="Query CID:"
            name="cid"
            errors={errors}
          />
          <Button type="submit">Query</Button>
        </div>
      </Form>
    </Card>
  );
}

export default QueryForm;
