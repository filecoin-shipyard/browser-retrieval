import React from 'react';
import classNames from 'classnames';
import Label from '../Label';
import Input from '../Input';
import Button from '../Button';
import Error from '../Error';

function InputField({ className, label, name, submit, errors, ...rest }, ref) {
  return (
    <div className={classNames(className, 'flex flex-col')}>
      <Label className="mb-2">
        {label}
      </Label>
      <div className="flex">
        <Input ref={ref} className="flex-1" name={name} {...rest} />
        {submit && (
          <Button className="ml-4" type="submit">
            Save
          </Button>
        )}
      </div>
      <Error className="mt-1" error={errors[name]} />
    </div>
  );
}

export default React.forwardRef(InputField);
