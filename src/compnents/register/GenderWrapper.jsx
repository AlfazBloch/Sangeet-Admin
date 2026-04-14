import { isValidElement, useState } from 'react'
import style from './style.module.css'
import { IoMale, IoFemale } from '../../utility'
import { useRegister } from './register.context';

function GenderWrapper({dataKey,dataValue}) {
  const {manupulateFormData} = useRegister();
  return (
    <div className={style.GenderWrapper}>
      <div className={style.Gender}>
        <label>Male</label>
        <div
          className={`${style.GenderIcon} ${dataValue.value == 'male' ? style.GenderSelected : ''}`}
          onClick={() => {
            manupulateFormData(dataKey,{value:'male',isValid:true})
          }}
        >
          <IoMale />
        </div>
      </div>
      <div className={style.Gender}>
        <label>Female</label>
        <div
          className={`${style.GenderIcon} ${dataValue.value == 'female' ? style.GenderSelected : ''}`}
          onClick={() => {
            manupulateFormData(dataKey,{value:'female',isValid:true})
          }}
        >
          <IoFemale />
        </div>
      </div>
    </div>
  )
}

export default GenderWrapper
