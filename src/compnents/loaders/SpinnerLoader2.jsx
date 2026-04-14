import './SpinnerLoader2.css';

function SpinnerLoader2({
    width = '20px',
    activeColor = '#1b3b5f',
    trackColor = '#c0c0c0'
}) {
    return (
        <svg
            className="loader2" viewBox="0 0 384 384" xmlns="http://www.w3.org/2000/svg"
            style={{
                '--w': width,
                '--ac': activeColor,
                '--tc': trackColor
            }}
        >
            <circle
                className="active"
                pathLength="360"
                fill="transparent"
                strokeWidth="32"
                cx="192"
                cy="192"
                r="176"
            ></circle>
            <circle
                className="track"
                pathLength="360"
                fill="transparent"
                strokeWidth="32"
                cx="192"
                cy="192"
                r="176"
            ></circle>
        </svg>

    )
}

export default SpinnerLoader2;