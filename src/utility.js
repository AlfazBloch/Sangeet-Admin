import { IoCheckmarkCircleSharp, IoCloseCircleSharp, IoInformationCircleOutline, IoInfinite, IoTimerSharp, IoMale, IoFemale, IoPlay, IoPause, IoLanguage, IoAdd, IoClose, IoAlbumsOutline, IoFilter, IoTime } from 'react-icons/io5';
import { IoIosArrowDown, IoIosArrowForward, IoIosCheckmarkCircle, IoIosCloseCircle, IoMdEye, IoMdArrowRoundBack, IoMdNotificationsOutline } from 'react-icons/io';
import { MdRefresh, MdModeEdit, MdMenuOpen, MdOutlineSettingsSuggest, MdCategory, MdFavorite, MdAudiotrack, MdSkipPrevious, MdSkipNext } from 'react-icons/md';
import { TbPhotoEdit, TbRepeat, TbRepeatOnce, TbDeviceSpeaker, TbListCheck, TbCopyCheck } from 'react-icons/tb';
import { RiExchangeLine, RiImageAddLine, RiTeamLine, RiArrowLeftWideFill } from 'react-icons/ri';
import { FaHistory, FaEye, FaRegFolder, FaRegFolderOpen } from 'react-icons/fa';
import { PiMusicNotesMinusFill, PiMusicNotesPlusFill } from 'react-icons/pi';
import { GoIssueTrackedBy, GoIssueTracks, GoSearch } from 'react-icons/go';
import { BiSolidEdit, BiHomeAlt2, BiPhotoAlbum } from 'react-icons/bi';
import { BsFillCalendarDayFill, BsCheckAll } from 'react-icons/bs';
import { HiSortAscending, HiSortDescending } from 'react-icons/hi';
import { LuImageMinus, LuTextCursorInput } from 'react-icons/lu';
import { HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2';
import { FaHeadphones, FaPlay, FaStop } from 'react-icons/fa6';
import { BsHddRack, BsInfoCircle } from 'react-icons/bs';
import { GoDotFill, GoGear } from 'react-icons/go';
import { AiOutlineLike } from 'react-icons/ai';
import { CgUserAdd } from 'react-icons/cg';
import { FiTrash2 } from "react-icons/fi";
import { CiTimer } from 'react-icons/ci';
import { TbCopy } from "react-icons/tb";
import { Zoom } from 'react-toastify';

export {
    IoCheckmarkCircleSharp, IoCloseCircleSharp, IoMdNotificationsOutline, BsInfoCircle, IoIosArrowForward, GoGear, FaRegFolder, FaRegFolderOpen, FaPlay, FaStop, MdRefresh, BsHddRack, TbCopyCheck, TbCopy, BsCheckAll, TbListCheck, FiTrash2, MdModeEdit, RiExchangeLine, CgUserAdd, PiMusicNotesMinusFill, IoMdArrowRoundBack, MdMenuOpen, IoInformationCircleOutline, LuImageMinus, TbPhotoEdit, BiSolidEdit, GoDotFill, TbDeviceSpeaker, AiOutlineLike, HiSpeakerWave, HiSpeakerXMark, MdOutlineSettingsSuggest, IoInfinite, TbRepeat, TbRepeatOnce, IoTimerSharp, IoMdEye, MdSkipPrevious, MdSkipNext, FaHeadphones, IoTime, MdFavorite, BsFillCalendarDayFill, FaEye, MdAudiotrack, RiArrowLeftWideFill, FaHistory, CiTimer, IoFilter, HiSortAscending, HiSortDescending, GoSearch, IoAlbumsOutline, GoIssueTracks, GoIssueTrackedBy, IoClose, IoAdd, RiTeamLine, MdCategory, IoLanguage, IoPlay, IoPause, IoIosCloseCircle, IoIosCheckmarkCircle, IoIosArrowDown, IoMale, IoFemale, BiHomeAlt2, BiPhotoAlbum, RiImageAddLine, LuTextCursorInput, PiMusicNotesPlusFill
};

// ----------------Arrays-------------
export const countryList = ['india', 'UK', 'USA', 'Italy', 'Argentina', 'Manchester'];
export const processStates = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PUBLISHED: 'published',
    UNPUBLISHED: 'unpublished'
}
export const collections = {
    TRACKS: 'tracks',
    ALBUMS: 'albums'
}

// ----------------Classes-------------
export class FetchWithAuthError extends Error {
    constructor(error, message) {
        super(message)
        this.errorObj = error
    }
}
// ----------------Objects-------------
export const regXPatterns = {
    unmRegX: /^[a-zA-Z0-9_@ ]{2,16}$/,
    emailRegX: /^([a-z]+)([0-9]*)([a-z]*)@([a-z]{2,})\.([a-z]{2,})$/,
    pwdRegX: /^.{6,16}$/
}
// need to change color
export const toastOption = {
    className: 'CustomToast',
    position: 'bottom-center',
    draggable: true,
    hideProgressBar: true,
    pauseOnHover: false,
    transition: Zoom
}

// ----------------methods-------------
export const extractDataFromObjOfObj = (obj, targetedKey) => {
    let data = {}
    for (const key in obj) {
        data[key] = obj[key][targetedKey]
    }
    return data
}

export const removeKeyFromObj = (obj, key) => {
    if (obj.hasOwnProperty(key)) {
        const newObj = { ...obj };
        delete newObj[key];
        return newObj;
    }
    return obj;
}

export const removeKeysFromObj = (obj, ...keys) => {
    if (keys.length > 0) {
        const newObj = { ...obj };
        for (const key of keys) {
            delete newObj[key];
        }
        return newObj;
    }
    return obj;
}

export const refreshAccessToken = async () => {
    try {
        const refreshRes = await fetch('http://localhost:8080/api/refreshAccessToken', {
            method: 'post',
            credentials: 'include',
        })
        const refreshData = await refreshRes.json();
        if (refreshRes.status >= 400) {
            if (refreshRes.status === 401) {
                const message = refreshData.errors[Object.keys(refreshData.errors)[0]].message;
                return { isRefTknInvalid: true, message, detail: { response: refreshRes, data: refreshData } };
            }
            throw new FetchWithAuthError(refreshData, 'http error');
        }
        return { isRefTknInvalid: false, message: 'Access token refresh' };
    }
    catch (error) {
        // return { isRefTknInvalid: true, message: 'An error occurred while refreshing the token' };
        throw error;
    }
}

export const fetchWithAuth = async (url, option) => {
    try {
        let res = await fetch(url, option);
        let data = await res.json();
        if (data.code >= 10 && data.code <= 13) {
            const { isRefTknInvalid, message } = await refreshAccessToken();
            if (isRefTknInvalid) return { isRedirect: true, message };

            res = await fetch(url, option);
            data = await res.json();
            return { data, status: res.status }
        }
        return { data, status: res.status }
    }
    catch (error) {
        // return { error, status: 600 }    
        throw error;
    }
}

export const formatTime = (second = 0) => {
    const min = (Math.floor(second / 60)).toString();
    const sec = (Math.floor(second % 60)).toString();

    return `${min.padStart(2, 0)}:${sec.padStart(2, 0)}`;
}

export const convertTimeToMinSec = (second = 0) => {
    const min = Math.floor(second / 60);
    const sec = Math.floor(second % 60);

    return `${min} min ${sec} sec`;
}

export const getItemFromLocalStorage = (key, type) => {
    const value = localStorage.getItem(key);
    if (value === null) return null;
    switch (type) {
        case 'bool':
            return value.toLowerCase() === 'true';
        case 'num':
            return Number(value);
        case 'obj':
            try {
                return JSON.parse(value);
            } catch (error) {
                console.log('Error parsing json', error)
                return null;
            }
        default:
            return value;
    }
}

export const handleImgFile = (e, cb) => {
    const file = e.target.files[0];
    if (!file) {
        cb(null, null, 'No file selected.');
        return;
    }
    if (!file.type.startsWith('image/')) {
        cb(null, null, 'File must be an image.');
        return;
    }
    const reader = new FileReader();
    reader.addEventListener('loadend', (e) => {
        cb(file, e.target.result, null);
    })
    reader.addEventListener('error', () => {
        cb(null, null, 'Failed to load image.');
    })
    reader.readAsDataURL(file);
}

export const downloadTrackWithAuth = async (url, options, retryCount = 0) => {
    try {
        const TOKEN_EXPIRED = 11;
        const MAX_RETRIES = 1;
        const response = await fetch(url, options);
        if (response.status >= 400) {
            const errorData = await response.json();
            if (errorData.code === TOKEN_EXPIRED && retryCount < MAX_RETRIES) {
                const { isRefTknInvalid, message } = await refreshAccessToken();
                if (isRefTknInvalid) {
                    return { isRedirect: true, message };
                }
                return downloadTrackWithAuth(url, options, retryCount + 1);
            }
            throw new FetchWithAuthError(errorData, 'serverError');
        }
        return response;
    }
    catch (error) {
        throw error;
    }
}