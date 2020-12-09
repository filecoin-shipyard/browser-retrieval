import './Logs.css'

import classNames from 'classnames'
import { Card } from 'components/Card'
import { IconButton } from 'components/IconButton'
import { Label } from 'components/Label'
import { Pre } from 'components/Pre'
import { observer } from 'mobx-react-lite'
import React, { useEffect, useRef } from 'react'
import { appStore } from 'shared/store/appStore'

export const Logs = observer<any>(({ className, ...rest }) => {
  const preRef = useRef() as any
  const firstRenderWithLogsRef = useRef(true)

  const { logsStore } = appStore
  const { logs } = logsStore

  useEffect(() => {
    if (firstRenderWithLogsRef.current) {
      firstRenderWithLogsRef.current = !logs
      preRef.current.scrollTop = preRef.current.scrollHeight
    } else {
      preRef.current.scrollTo({ top: preRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [logs])

  function clearLogsMessage() {
    logsStore.clear()
  }

  return (
    <div className={classNames(className, 'p-4 main-page')} {...rest}>
      <Card className="p-4">
        <div className="flex">
          <Label className="flex-1 mb-2">Logs</Label>
          <IconButton icon="trash" onClick={clearLogsMessage} />
        </div>
        <Pre ref={preRef} className="Logs--pre">
          {logs && logs.length ? logs.join('\n') : ' '}
        </Pre>
      </Card>
    </div>
  )
})
