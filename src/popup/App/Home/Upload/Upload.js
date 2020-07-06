import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import { useDropzone } from 'react-dropzone';
import setData from 'src/shared/setData';

function Upload({ className, ...rest }) {
  const [{ readingCount, error }, setState] = useState({});
  const isReading = Boolean(readingCount);

  const onDrop = useCallback(files => {
    setState({ readingCount: files.length });

    files.forEach(file => {
      const reader = new FileReader();

      reader.onerror = () => {
        setState(previousState => ({
          readingCount: previousState.readingCount - 1,
          error: reader.error,
        }));
      };

      reader.onload = async () => {
        await setData(reader.result);
        setState(previousState => ({ readingCount: previousState.readingCount - 1 }));
      };

      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  function getClassNames() {
    if (isDragActive) {
      return 'border-brand text-brand';
    }

    if (isReading || !error) {
      return 'border-darkgray text-darkgray hover:border-brand hover:text-brand cursor-pointer';
    }

    return 'border-red text-red';
  }

  function renderText() {
    if (isReading) {
      return 'Reading file...';
    }

    if (error) {
      return error.message;
    }

    return 'Drop files or click here';
  }

  return (
    <div
      className={classNames(
        className,
        'flex items-center justify-center h-20 border-dashed border-2 rounded font-bold focus:outline-none transition-all duration-200',
        getClassNames(),
      )}
      {...getRootProps()}
      {...rest}
    >
      <input {...getInputProps()} />
      {renderText()}
    </div>
  );
}

export default Upload;
