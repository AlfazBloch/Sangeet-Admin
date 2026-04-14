import React from 'react'
import './BouncyLoader.css'

function BouncyLoader({bcColor = '#fff'}) {
    return (
        <div className="loading" style={{'--bouncy-loader-bc' : bcColor }}>
            <div className="i"></div>
            <div className="a"></div>
            <div className="u"></div>
        </div>
    )
}

export default BouncyLoader
