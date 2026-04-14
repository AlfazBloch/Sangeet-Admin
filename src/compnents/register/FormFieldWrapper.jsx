import React, { useEffect, useState } from 'react'
import style from './style.module.css'
import { IoIosCheckmarkCircle, IoIosCloseCircle } from '../../utility'
import { useRegister } from './register.context'

function FormFieldWrapper({ fieldName, fieldType = 'text', dataKey, dataValue, regX = '', passwordValue = '', confirmPassword = '' }) {
  const { manupulateFormData, pushHideErrorMethod, serverErrors, removeServerError } = useRegister();
  const [showError, setShowError] = useState(false);
  const error = dataValue.error;

  // to hide errorbox when parent is click
  useEffect(() => {
    const hideErrorBox = () => {
      setShowError(false);
    }
    pushHideErrorMethod(hideErrorBox);
  }, [])



  const handleInputChange = (e) => {
    const value = e.target.value;
    const isEmpty = !value.length > 0;

    if (dataKey === 'confirmPassword') {
      const isConfirm = (value === passwordValue);
      manupulateFormData(dataKey, { value, isEmpty, isValid: isConfirm, error });
    }
    else if (dataKey === 'password') {
      // to empty confirm password
      const emptyConfirmPwd = { ...confirmPassword, value: '', isEmpty: true, isValid: false };
      manupulateFormData('confirmPassword', emptyConfirmPwd);

      // to fill the password state
      const isValid = regX.test(value);
      manupulateFormData(dataKey, { value, isEmpty, isValid, error });
    }
    else {
      const isValid = regX.test(value);
      manupulateFormData(dataKey, { value, isEmpty, isValid, error })
    }
    removeServerError(dataKey);
  }
  return (
    <div className={style.FormFieldWrapper}>
      <div className={style.InputField}>
        <input
          type={fieldType}
          required
          value={dataValue.value}
          onChange={handleInputChange}
        />
        <label>{fieldName}</label>
        {
          (!dataValue.isEmpty && dataValue.isValid && !serverErrors[dataKey])
            ? <IoIosCheckmarkCircle className={style.Icon} /> : ''
        }
        {
          (!dataValue.isEmpty && !dataValue.isValid) || (serverErrors[dataKey])
            ? <IoIosCloseCircle className={`${style.Icon} ${style.IconError}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowError((prev) => !prev)
              }} /> : ''
        }
        <div className={`${style.ErrorBox} ${showError ? style.ShowBlock : ''}`}>{serverErrors[dataKey] ? serverErrors[dataKey] : error}</div>
      </div>
    </div>
  )
}

export default FormFieldWrapper
