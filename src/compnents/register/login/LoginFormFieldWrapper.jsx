import { useEffect, useState } from 'react'
import style from '../style.module.css'
import { IoIosCheckmarkCircle, IoIosCloseCircle } from '../../../utility.js'
import { useRegister } from '../register.context.js';

function LoginFormFieldWrapper({ fieldName, fieldType = 'text', dataKey, dataValue, regX = '', manupulateLoginData }) {
    const [showError, setShowError] = useState(false);
    const error = dataValue.error;
    const { pushHideErrorMethod, removeServerError, serverErrors } = useRegister();

    useEffect(() => {
        const hideError = () => {
            setShowError(false);
        }
        pushHideErrorMethod(hideError);
    }, [])

    const handleInputChange = (e) => {
        const value = e.target.value;
        const isEmpty = !value.length > 0;
        const isValid = regX.test(value);
        manupulateLoginData(dataKey, { value, isEmpty, isValid, error });
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

export default LoginFormFieldWrapper
