import { useState } from 'react';
import { IoIosArrowDown, countryList } from '../../utility'
import style from './style.module.css'
import { useRegister } from './register.context';

function CountryWrapper({dataKey,dataValue}) {
    const [isExpanded, setExpanded] = useState(false);              //for drop down list
    const {manupulateFormData} = useRegister();
    return (
        <div
            className={style.CountryWrapper}
            onClick={() => setExpanded((prev) => !prev)}
            onMouseLeave={() => setExpanded(false)}
        >
            <label>{dataValue.value || 'Select Country'}</label>
            <IoIosArrowDown className={`${isExpanded ? style.Rotate180 : ''}`} />
            <div
                className={`${style.CountryList} ${isExpanded ? style.ShowFlex : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {
                    countryList.map((country)=>{
                        return (
                            <span key={country}
                                className={style.Country}
                                onClick={()=>{
                                    setExpanded(false)
                                    manupulateFormData(dataKey,{value:country,isValid:true})
                                }}
                            >{country}</span>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default CountryWrapper
