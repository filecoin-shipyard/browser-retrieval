/* global chrome */

import React from 'react';
import {useForm} from 'react-hook-form';
import classNames from 'classnames';
import Form from 'src/popup/components/Form';
import Button from 'src/popup/components/Button';
import Card from 'src/popup/components/Card';
import Label from 'src/popup/components/Label';
import TextArea from 'src/popup/components/TextArea';
import messageTypes from 'src/shared/messageTypes';
import './Editor.css';
import Error from "src/popup/components/Error";
import useOptions from "src/popup/hooks/useOptions";

function Editor({className, ...rest}) {
  const {handleSubmit, register, errors} = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit(data) {
    setOptions(data);
    chrome.runtime.sendMessage({ messageType: messageTypes.automation, data });
  }

  function onBlur() {
    chrome.runtime.sendMessage({ messageType: messageTypes.automationStop });
  }

  return (
      <div className={classNames(className, 'p-4')} {...rest} onBlur={onBlur}>
        <Card className="p-4">
          <Form className="flex-col" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex">
              <Label className="flex-1 mb-2">Automation code</Label>
            </div>
            <TextArea ref={register({ required: 'Required' })}
                      className="Editor--textarea"
                      name="automationCode"
                      defaultValue={options.automationCode} />
            <Error className="mt-1" error={errors.automationCode} />
            <Button className="w-32 mt-4" type="submit">Save</Button>
          </Form>
        </Card>
      </div>
  );
}

export default Editor;
