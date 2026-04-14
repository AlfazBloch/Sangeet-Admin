import { useEffect, useState } from 'react';
import style from './editoverlay.module.css'

import { TbCopy, TbCopyCheck, toastOption } from '../../../utility.js'
import { toast } from 'react-toastify';

function DeleteConfirmationPopup({
    isHidden = false,
    wrapperStyle = {},
    popupStyle = {},

    onCancel = () => { },
    onDelete = () => { },

    title = '',
    message = '',
    detailedMessage = '',
    confirmationString = '',
}) {
    const [confirmationStr, setConfirmationStr] = useState('');
    const [formattedConfirmationString, setFormattedConfirmationString] = useState(confirmationString.replace(/\s+/g,'-').toLowerCase());
    const [isCopied, setCopied] = useState(false);

    const onCopyConfirmString = async () => {
        try {
            if (isCopied) return;

            await navigator.clipboard.writeText(formattedConfirmationString);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
        catch (error) {
            toast.info('Failed to copy confirmation key.', toastOption);
            console.log(error);
        }
    }
    useEffect(() => {
        if (isHidden) {
            setConfirmationStr('');
            setCopied(false);
        }
    }, [isHidden]);
    useEffect(() => {

    }, []);
    return (
        <div
            className={`${style.PopupWrapper} ${!isHidden ? style.ShowOverlay : ''}`}
            style={{ ...wrapperStyle }}
        >
            <div
                className={style.DeleteConfirmationPopup}
                style={{ ...popupStyle }}
            >
                <h2>{title}</h2>
                <p>{message}</p>
                <p>{detailedMessage}</p>
                <p>Type <b>"{formattedConfirmationString}"</b> to confirm deletion.</p>
                <span
                    onClick={onCopyConfirmString}
                >
                    {
                        isCopied ?
                            <>
                                <TbCopyCheck />
                                Copied

                            </>
                            :
                            <>
                                <TbCopy />
                                Copy Key
                            </>
                    }
                </span>
                <input
                    type="text"
                    placeholder='Type Confirmation Key'
                    value={confirmationStr}
                    onChange={(e) => setConfirmationStr(e.target.value)}
                />
                <div>
                    <button onClick={onCancel}>Cancel</button>
                    {
                        confirmationStr === formattedConfirmationString ?
                            <button
                                onClick={onDelete}
                            >Delete</button>
                            :
                            <button
                                style={{
                                    backgroundColor: '#d28d8d',
                                    cursor: 'default'
                                }}
                            >Delete</button>
                    }
                </div>
            </div>
        </div>
    )
}

export default DeleteConfirmationPopup
