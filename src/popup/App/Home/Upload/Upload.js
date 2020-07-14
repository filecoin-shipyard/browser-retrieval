/* global chrome */

import React, { useCallback } from 'react';
import classNames from 'classnames';
import { useDropzone } from 'react-dropzone';
import messageTypes from 'src/shared/messageTypes';

function Upload({ className, ...rest }) {
  const onDrop = useCallback(files => {
    // workaround because files are not JSON-ifiable
    const backgroundWindow = chrome.extension.getBackgroundPage();
    backgroundWindow.filesToUpload = files;

    chrome.runtime.sendMessage({ messageType: messageTypes.uploadFiles });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      className={classNames(
        className,
        'flex items-center justify-center h-20 border-dashed border-2 rounded font-bold focus:outline-none transition-all duration-200 overflow-hidden',
        isDragActive
          ? 'border-brand text-brand'
          : 'border-darkgray text-darkgray hover:border-brand hover:text-brand cursor-pointer',
      )}
      {...getRootProps()}
      {...rest}
    >
      <input {...getInputProps()} />
      <span>Drop files or click here</span>
    </div>
  );
}

export default Upload;
