import React from 'react';
import { useForm } from 'react-hook-form';
import useOptions from 'src/hooks/useOptions';

function PriceForm() {
  const { handleSubmit, register, errors } = useForm();
  const [options, setOptions] = useOptions();

  function onSubmit({ cid, price }) {
    setOptions({
      pricePerByte: {
        ...options.pricePerByte,
        [cid]: parseFloat(price),
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <table>
        <tbody>
          <tr>
            <td>
              <label for="cid">CID</label>
            </td>
            <td>
              <input
                ref={register({ required: 'Required' })}
                name="cid"
                type="text"
                defaultValue="*"
              />
              {errors.cid && errors.cid.message}
            </td>
          </tr>
          <tr>
            <td>
              <label for="price">Price per byte</label>
            </td>
            <td>
              <input
                ref={register({ required: 'Required' })}
                name="price"
                type="number"
                min="0"
                step="any"
                defaultValue={options.pricePerByte['*'].toFixed(10)}
              />
              {errors.price && errors.price.message}
            </td>
          </tr>
          <tr>
            <td></td>
            <td>
              <button type="submit">Save</button>
            </td>
          </tr>
        </tbody>
      </table>
    </form>
  );
}

export default PriceForm;
