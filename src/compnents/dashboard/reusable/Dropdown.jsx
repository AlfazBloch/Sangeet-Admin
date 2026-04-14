import React, { useState } from 'react'
import style from './style.module.css'
import utilStyle from '../../util.module.css'
import { IoIosArrowDown } from '../../../utility'

function Dropdown({ initialText, listItems, listKey, onChange, dataValue={value:'Select'}, dataKey}) {
  const [isExpanded, setExpanded] = useState(false);
  return (
    <div
      className={style.Dropdown}
      onClick={() => setExpanded((prev) => !prev)}
      onMouseLeave={()=>setExpanded(false)}
    >
      <span>{dataValue.value}</span>
      <IoIosArrowDown className={isExpanded ? utilStyle.Rotate180 : ''} />
      <div className={`${style.List} ${!isExpanded ? utilStyle.Hide : ''}`}>
        {listItems?.map(({_id, [listKey]:item },index) => {
          return (
                <span 
                  key={index}
                  onClick={()=>{ onChange( dataKey,{...dataValue, id:_id, value:item, isEmpty:false} ) } }
                >{item}</span>
            )
        })}
      </div>
    </div>
  )
}

export default Dropdown