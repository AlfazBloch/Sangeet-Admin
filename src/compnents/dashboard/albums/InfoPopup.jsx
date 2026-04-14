import style from './editoverlay.module.css'

function InfoPopup({
    isHidden = false,
    wrapperStyle = {},
    popupStyle = {},

    title,
    message,
    otherInfo,
    onOk = () => {}
}) {
    return (
        <div
            className={`${style.PopupWrapper} ${!isHidden ? style.ShowOverlay : ''}`}
            style={{ ...wrapperStyle }}
        >
            <div
                className={style.InfoPopup}
                style={{ ...popupStyle }}
            >
                <h2>{title}</h2>
                <p>{message}</p>
                <div>
                    <button
                        onClick={()=>{
                            onOk()
                        }}
                    >Ok</button>
                </div>
            </div>
        </div>
    )
}

export default InfoPopup
