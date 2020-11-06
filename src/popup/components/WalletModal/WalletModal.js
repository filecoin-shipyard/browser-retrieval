import React from 'react';
import { useForm } from 'react-hook-form';
import classNames from 'classnames';
import * as signer from '@zondax/filecoin-signing-tools';

import useOptions from 'src/popup/hooks/useOptions';
import Form from 'src/popup/components/Form';
import Label from 'src/popup/components/Label';
import InputField from 'src/popup/components/InputField';
import InputFieldPassword from 'src/popup/components/InputFieldPassword';

function WalletModal({ className, ...rest }) {
  const { handleSubmit, register, setError, errors } = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit(data) {
    const key = signer.keyRecover(data.privateKey);

    if (key.address === data.wallet || key.address === data.wallet.replace(/^t/, 'f')) {
      setOptions({
        ...data,
        showWalletModal: false,
      });
    } else {
      setError('privateKey', { type: 'manual', message: "Wallet and private key don't match" });
    }
  }

  return (
    <div className={classNames(className, 'relative mx-2')} {...rest}>
        <div className="fixed inset-0 flex items-center justify-center z-10">
          <div className="absolute inset-0 bg-black opacity-50" />
          <div
            className="relative flex-1 m-8 min-w-0 rounded bg-white p-4 shadow-xl"
            onClick={event => event.stopPropagation()}
          >
            <Label className="ml-4">Before you can start using this tool, you must supply a wallet address and base64 private key.</Label>
            <Form className="flex-col" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex">
                <InputField
                  ref={register({ required: 'Required' })}
                  className="flex-1 mr-4"
                  label="Wallet"
                  name="wallet"
                  errors={errors}
                  defaultValue={options.wallet}
                  placeholder={options.walletPlaceholder}
                  onFocus={(e) => e.target.placeholder = ""}
                  onBlur={(e) => e.target.placeholder = options.walletPlaceholder}
                />
                <InputFieldPassword
                  ref={register({ required: 'Required' })}
                  className="flex-1"
                  label="Private key (secp256k1)"
                  name="privateKey"
                  errors={errors}
                  defaultValue={options.privateKey}
                  placeholder={options.privateKeyPlaceholder}
                  onFocus={(e) => e.target.placeholder = ""}
                  onBlur={(e) => e.target.placeholder = options.privateKeyPlaceholder}
                  submit
                />
              </div>
            </Form>
          </div>
        </div>
    </div>
  );
}

export default WalletModal;
