import style from './editoverlay.module.css'

function DiscardPopup({
    isHidden,   
    onCancel = () => { },
    onDiscard = () => { },
    wrapperStyle = {},
    popupStyle = {}
}) {

    return (
        <div
            className={`${style.PopupWrapper} ${!isHidden ? style.ShowOverlay : ''}`}
            style={{ ...wrapperStyle }}
        >
            <div
                className={style.DiscardPopup}
                style={{ ...popupStyle }}
            >
                <h2>Discard Changes?</h2>
                <p>Do you want to discard your edits? Your current changes will be lost.</p>
                <div>
                    <button
                        onClick={onCancel}
                    >Cancel</button>
                    <button
                        onClick={onDiscard}
                    >Discard</button>
                </div>
            </div>
        </div>
    )
}

export default DiscardPopup
