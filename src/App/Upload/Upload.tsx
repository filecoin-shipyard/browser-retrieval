import classNames from 'classnames'
import { IconButton } from 'components/IconButton'
import { appStore } from 'shared/store/appStore'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { observer } from 'mobx-react-lite'

export const Upload = observer<any>(({ className, ...rest }) => {
  const [finishUpload, setFinishUpload] = useState(false)

  const { uploadStore } = appStore

  const progress = uploadStore.progress || 0
  const onDrop = useCallback((files) => {
    uploadStore.upload(files)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (progress === 1) {
      setFinishUpload(true)

      setTimeout(() => {
        setFinishUpload(false)
      }, 2000)
    }
  }, [progress])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <div className={classNames('p-4')}>
      <div
        className={classNames(
          className,
          'p-4 relative flex items-center justify-center h-20 border-dashed border-2 rounded font-bold focus:outline-none transition-all duration-200 overflow-hidden',
          isDragActive
            ? 'border-brand text-brand'
            : 'border-darkgray text-darkgray hover:border-brand hover:text-brand cursor-pointer',
        )}
        {...getRootProps()}
        {...rest}
      >
        <div className="absolute inset-0 bg-gray" style={{ transform: `translateX(${(progress - 1) * 100}%)` }} />
        <input {...getInputProps()} />
        <span className="relative">{finishUpload ? <IconButton icon="success" /> : 'Drop files or click here'}</span>
      </div>
    </div>
  )
})
