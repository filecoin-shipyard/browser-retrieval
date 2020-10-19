/* global chrome */

import React, {useState} from 'react';
import { useForm } from 'react-hook-form';
import Card from 'src/popup/components/Card';
import Form from 'src/popup/components/Form';
import Label from 'src/popup/components/Label';
import Input from 'src/popup/components/Input';
import Checkbox from 'src/popup/components/Checkbox';
import Button from 'src/popup/components/Button';
import Error from 'src/popup/components/Error';
import messageTypes from 'src/shared/messageTypes';

function QueryForm(props) {
  const { handleSubmit, register, errors } = useForm();
  const [checked, setChecked] = useState(false);

  function onSubmit({ cid, minerID }) {
    const msg = {
      cid: cid,
      minerID: minerID
    }
    chrome.runtime.sendMessage({ messageType: messageTypes.query, msg});
  }

  function onCheck() {
    if (checked) {
      document.getElementById("minerID").value = '';
    }

    return setChecked(!checked);
  }

  return (
    <Card {...props}>
      <Form className="flex-col" onSubmit={handleSubmit(onSubmit)}>
        
        <Label className="mb-2" for="cid">
          Query CID *
        </Label>
        <div className="flex">
          <Input ref={register({ required: 'Required' })} name="cid" className="flex-1 mr-4" />
          <Button type="submit">Query</Button>
        </div>

        <Error className="mt-2" error={errors.cid} />

        <div className="flex flex-row mt-2">
          <div className=" flex flex-row mr-2 mt-6">
            <Checkbox className="mb-2" name="minerCheckbox" id="minerCheckbox" onClick={onCheck}/>
            <Label className="mt-1" for="minerCheckbox">
              Query primary market also?
            </Label>
          </div>
          <div className="flex-1">
            <Label className={checked ? "mt-2 mb-2" : "mt-2 mb-2 opacity-50"} for="minerID">
              Miner ID
            </Label>
            <div className="flex">
              <Input ref={register(checked ? {required: 'Required'} : {required: false})} id="minerID" name="minerID" className="flex-1 mr-4" disabled={!checked}/>
              <div style={{width: '85px', height: '40px'}} />
            </div>
            {checked && <Error className="mt-2" error={errors.minerID} />}
          </div>
        </div>
      </Form>
    </Card>
  );
}

export default QueryForm;
