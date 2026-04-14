import style from './style.module.css'
import { FaCheck } from "react-icons/fa6";
import { useState } from 'react';
function Checkbox({
    label = '',
    onCheckChange = () => { },
    boxStyle = {},
    iconStyle = {},
    selectedStyle = {
        box : {},
        icon : {}
    },
    value,
    defaultChecked = false
}) {
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    const isChecked = value !== undefined ? value : internalChecked;

    const onCheckboxClick = () => {
        if (value === undefined) {
            setInternalChecked((prev) => !prev);
        }
        onCheckChange(!isChecked);
    }
     
    return (
        <div className={style.CheckboxWrapper}>
            <div
                className={style.Checkbox}
                onClick={onCheckboxClick}
                style={{ ...boxStyle, ...(isChecked ? selectedStyle.box : {}) }}
            >
                {isChecked &&
                    <FaCheck style={{ ...iconStyle, ...(isChecked ? selectedStyle.icon : {})  }} />
                }
            </div>
            <label htmlFor="checkbox">
                {label}
            </label>
        </div>
    )
}

export default Checkbox;