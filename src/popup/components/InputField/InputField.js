import React from 'react';
import classNames from 'classnames';
import Label from 'src/popup/components/Label';
import Input from 'src/popup/components/Input';
import Error from 'src/popup/components/Error';

function InputField({ className, label, name, errors, ...rest }, ref) {
  return (
    <div className={classNames(className, 'flex flex-col')}>
      <Label className="mb-2" for={name}>
        {label}
      </Label>
      <Input ref={ref} name={name} {...rest} />
      <Error className="mt-1" error={errors[name]} />
    </div>
  );
}

export default React.forwardRef(InputField);
