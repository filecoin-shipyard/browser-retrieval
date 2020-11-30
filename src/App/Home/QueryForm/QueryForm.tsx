import './QueryForm.css'

import { Button } from 'components/Button'
import { Card } from 'components/Card'
import { Checkbox } from 'components/Checkbox'
import { Error } from 'components/Error'
import { Form } from 'components/Form'
import { Input } from 'components/Input'
import { Label } from 'components/Label'
import { SubLabel } from 'components/SubLabel'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { appStore } from 'shared/store/appStore'
import { observer } from 'mobx-react-lite'

export const QueryForm = observer((props) => {
  const { handleSubmit, register, errors } = useForm()
  const { offersStore, queriesStore } = appStore

  async function onSubmit({ cid, minerID }) {
    queriesStore.setCid(cid)

    const msg = {
      cid,
      minerID,
    }

    // TODO: @brunolm remove
    msg.cid = 'bafk2bzacebhlhbcnhmvover42qq5bx773c522skieho6nhtbz7d2ow3f4sw24'
    msg.minerID = 'f019243'

    appStore.query(msg)
  }

  if (!queriesStore.cid) {
    offersStore.clear()
  }

  function onCheck() {
    if (queriesStore.checked) {
      const minerInput = document.getElementById('minerID') as HTMLInputElement
      minerInput.value = ''
    }

    return queriesStore.toggleChecked()
  }

  const { checked } = queriesStore

  return (
    <Card {...props}>
      <Form className="flex-col" onSubmit={handleSubmit(onSubmit)}>
        <Label className="mb-2" htmlFor="cid">
          Query Retrieval Network by CID
        </Label>
        <SubLabel className="mb-2 sublabel-text">
          (Tip: try bafk2bzacebhlhbcnhmvover42qq5bx773c522skieho6nhtbz7d2ow3f4sw24 on storage miner f019243)
        </SubLabel>
        <div className="flex">
          <Input ref={register({ required: 'Required' })} name="cid" className="flex-1 mr-4" />
          <Button type="submit">Query</Button>
        </div>

        <Error className="mt-2" error={errors.cid} />

        <div className="flex flex-row mt-2">
          <div className=" flex flex-row mr-2 mt-6">
            <Checkbox className="mb-2" name="minerCheckbox" id="minerCheckbox" onClick={onCheck} />
            <Label className="mt-1" htmlFor="minerCheckbox">
              Query primary market also?
            </Label>
          </div>
          <div className="flex-1">
            <Label className={checked ? 'mt-2 mb-2' : 'mt-2 mb-2 opacity-50'} htmlFor="minerID">
              Miner ID
            </Label>
            <div className="flex">
              <Input
                ref={register(checked ? { required: 'Required' } : { required: false })}
                id="minerID"
                name="minerID"
                className="flex-1 mr-4"
                disabled={!checked}
              />
              <div style={{ width: '85px', height: '40px' }} />
            </div>
            {checked && <Error className="mt-2" error={errors.minerID} />}
          </div>
        </div>
      </Form>
    </Card>
  )
})
