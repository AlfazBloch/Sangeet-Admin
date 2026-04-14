import style from './editoverlay.module.css'

function LoaderContainer({ loader: Loader, isHidden = false, containerStyle = {} }) {
    return (
        <div
            className={`${style.LoaderContainer} ${!isHidden ? style.ShowOverlay : ''}`}
            style={{...containerStyle}}
        >
            <Loader />
        </div >
    )
}

export default LoaderContainer
