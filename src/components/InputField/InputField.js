import React from 'react';
import classNames from 'classnames';
import Label from 'src/components/Label';
import Input from 'src/components/Input';
import Error from 'src/components/Error';

function InputField({ className, label, name, errors, ...rest }, ref) {
  return (
    <div className={classNames(className, 'mb-4')} {...rest}>
      <div className="flex items-center">
        <Label className="w-24 text-right" for={name}>
          {label}
        </Label>
        <Input ref={ref} className="ml-2 flex-grow" name={name} {...rest} />
      </div>
      <Error className="mt-1" error={errors[name]} />
    </div>
  );
}

export default React.forwardRef(InputField);
