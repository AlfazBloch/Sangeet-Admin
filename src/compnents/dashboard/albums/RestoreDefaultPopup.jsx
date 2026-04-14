import style from './editoverlay.module.css'
import CheckBox from '../reusable/Checkbox.jsx'
import { useEffect, useState } from 'react'

function RestoreDefaultPopup({
    isHidden = true,
    wrapperStyle = {},
    popupStyle = {},
    changes = {},
    onCancel = () => { },
    onRestore = () => { },
}) {

    const [selectedFields, setSelectedFields] = useState([]);
    const [fields, setFields] = useState([]);

    const onCheckChange = (isChecked, oldKey) => {
        const newSelectedFields = [...selectedFields];
        if (!isChecked) {
            const index = newSelectedFields.indexOf(oldKey);
            newSelectedFields.splice(index, 1);

            setSelectedFields(newSelectedFields);
            return;
        }
        newSelectedFields.push(oldKey);
        setSelectedFields(newSelectedFields);
    }
    useEffect(() => {
        const keys = Object.keys(changes).filter(key => key !== 'duration');
        const modifiedKeys = [];

        for (const key of keys) {
            let val;
            if (key === 'trackImage') {
                val = 'image';
            }
            else if (key === 'trackFile') {
                val = 'track';
            }
            else if (key === 'featuredArtists') {
                val = 'ft. artist';
            }
            else {
                val = key;
            }
            modifiedKeys.push([val, key]);
        }

        setSelectedFields(keys);
        setFields(modifiedKeys);
    }, [changes]);

    return (
        <div
            className={`${style.PopupWrapper} ${!isHidden ? style.ShowOverlay : ''}`}
            style={{ ...wrapperStyle }}
        >
            <div
                className={style.RestoreDefaultPopup}
                style={{ ...popupStyle }}
            >
                <h2>Restore Changes</h2>
                <p>Select the changes you want to reset. Only the selected fields will be restored to default.</p>
                <ul>
                    {
                        fields.map(([newKey, oldKey], index) => {
                            return (
                                <li key={index}>
                                    <span>{newKey}</span>
                                    <CheckBox
                                        boxStyle={{
                                            height: '13px',
                                            width: '13px',
                                        }}
                                        value={selectedFields.includes(oldKey)}
                                        onCheckChange={(isChecked) => onCheckChange(isChecked, oldKey)}
                                    />
                                </li>
                            )
                        })
                    }

                </ul>
                <div>
                    <button
                        onClick={onCancel}
                    >Cancel</button>
                    {
                        selectedFields.length > 0 ?
                            <button onClick={() => onRestore(selectedFields)}>
                                Restore({selectedFields.length})
                            </button>
                            :
                            <button style={{ color: 'var(--victory-grey)' }}>
                                Restore
                            </button>
                    }
                </div>
            </div>
        </div>
    )
}

export default RestoreDefaultPopup
