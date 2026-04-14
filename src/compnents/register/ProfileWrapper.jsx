import { useState, useRef, useEffect } from 'react'
import style from './style.module.css'
import { IoIosCheckmarkCircle, IoIosCloseCircle } from '../../utility'
import defaultProfiile from '../../assets/default-profile.jpg'
import { useRegister } from './register.context';

function ProfileWrapper({ dataKey, dataValue }) {
    const { manupulateFormData, pushHideErrorMethod, serverErrors, setServerErrors } = useRegister()
    const uploader = useRef();                                      //for file uploader
    const [selectedProfile, setSelectedProfile] = useState(null);   //for profile selector
    const [isWrongType, setWrongType] = useState(false);             //to check image type
    const [showError, setShowError] = useState(false);
    const error = dataValue.error;
    useEffect(()=>{
        const hideErrorBox = () =>{
            setShowError(false);
        }
        pushHideErrorMethod(hideErrorBox);
    },[]);
    const removeServerError = (key) => {
        if (serverErrors.hasOwnProperty(key)) {
          const newError = { ...serverErrors };
          delete newError[key];
          setServerErrors(newError);
        }
    }
    const profileHandler = (e) => {
        const file = e.target.files[0];
        if (file) {
            removeServerError(dataKey);
            const type = file.type.split('/')[0];
            if (type === 'image') {
                setWrongType(false);
                const reader = new FileReader();
                reader.addEventListener('load', (e) => {
                    const image = e.target.result;
                    setSelectedProfile(image)
                    manupulateFormData(dataKey, { value: file, isEmpty:false, isValid: true, selectedProfile:true, error });
                })
                reader.readAsDataURL(file);
            }
            else {
                setWrongType(true);
                setSelectedProfile(null);
                manupulateFormData(dataKey, { value: null, isEmpty: true, isValid: false, selectedProfile:false, error });
            }
        }
    }

    return (
        <div className={style.ProfileWrapper}>
            <div className={style.ProfileLabel}>
                <label>Artist Profile</label>
            </div>
            <div className={style.Profile}>
                <img src={`${dataValue.selectedProfile ? selectedProfile : defaultProfiile}`} />
                <div
                    className={style.BrowseBtn}
                    onClick={() => uploader.current.click()}
                >Browse Profile...</div>
                <input
                    type="file"
                    ref={uploader}
                    onChange={profileHandler}
                    accept='image/*'
                />
            </div>
            {
                !isWrongType && !dataValue.isEmpty && !serverErrors[dataKey] ?
                <IoIosCheckmarkCircle className={style.Icon} /> : ''
            }
            { 
                isWrongType || serverErrors[dataKey] ?
                <IoIosCloseCircle className={`${style.Icon} ${style.IconError}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setShowError((prev) => !prev)
                }} /> : ''
            }
            <div className={`${style.ErrorBox} ${style.profileErrorBox} ${showError ? style.ShowBlock : ''}`}>{serverErrors[dataKey] ? serverErrors[dataKey] : error}</div>
        </div>
    )
}

export default ProfileWrapper
