import React from 'react';
import classNames from 'classnames';
import Label from 'src/popup/components/Label';
import Input from 'src/popup/components/Input';
import Button from 'src/popup/components/Button';
import Error from 'src/popup/components/Error';

function InputField({ className, label, name, submit, errors, ...rest }, ref) {
  return (
    <div className={classNames(className, 'flex flex-col')}>
      <Label className="mb-2" for={name}>
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
