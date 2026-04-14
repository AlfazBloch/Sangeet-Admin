import React from 'react'
import Slider from 'rc-slider'
import "rc-slider/assets/index.css"

function InputRange({ value, min = 0, max = 100, onChange, onChangeComplete, vertical, trackStyle = {}, railStyle = {}, handleStyle = {} }) {
    return (
        <Slider
            value={value}
            min={min}
            max={max}
            onChange={onChange}
            onChangeComplete={onChangeComplete}
            railStyle={{
                backgroundColor: 'var(--ciment)',
                ...railStyle
            }}
            trackStyle={{
                backgroundColor: 'var(--light-green)',
                ...trackStyle
            }}
            handleStyle={{
                backgroundColor: 'var(--cream-choco)',
                border: 'unset',
                opacity: 'unset',
                boxShadow: 'unset',
                cursor: 'pointer',
                height: '12px',
                width: '12px',
                marginTop: '-4px',
                ...handleStyle
            }}
            vertical={vertical}
        />
    )
}

export default InputRange
