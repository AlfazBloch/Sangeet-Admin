import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { MasterLayoutContextProvider } from './layout.context'
import { useLocation } from 'react-router-dom';

import shaka from 'shaka-player';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../app.css';

import style from './style.module.css'
import { logo } from '../../assets/index.js'

import { FiTrash2, IoMdArrowRoundBack, MdMenuOpen, IoInformationCircleOutline, GoDotFill, TbDeviceSpeaker, HiSpeakerXMark, IoInfinite, TbRepeat, TbRepeatOnce, AiOutlineLike, FaPlay, IoTimerSharp, FaHeadphones, IoIosArrowDown, IoClose, BiHomeAlt2, GoIssueTracks, IoAlbumsOutline, RiArrowLeftWideFill, IoPlay, MdSkipNext, MdSkipPrevious, formatTime, IoPause, HiSpeakerWave, removeKeyFromObj, handleImgFile, FetchWithAuthError, fetchWithAuth, toastOption, TbPhotoEdit, LuImageMinus, BiSolidEdit, PiMusicNotesMinusFill, CgUserAdd, removeKeysFromObj, getItemFromLocalStorage, extractDataFromObjOfObj, TbListCheck, BsCheckAll, refreshAccessToken, downloadTrackWithAuth, BsHddRack, IoMdNotificationsOutline, IoCheckmarkCircleSharp, IoCloseCircleSharp, processStates } from '../../utility';

import InputRange from './reusable/InputRange.jsx'
import Checkbox from './reusable/Checkbox.jsx';
import ListOverlay from './albums/ListOverlay.jsx'
import DiscardPopup from './albums/DiscardPopup.jsx';
import RestoreDefaultPopup from './albums/RestoreDefaultPopup.jsx';

//loaders
import LoaderContainer from './albums/LoaderContainer.jsx';
import WavyPreloader from '../loaders/WavyPreloader.jsx';
import SpinnerLoader from '../loaders/SpinnerLoader.jsx'
import SpinnerLoader2 from '../loaders/SpinnerLoader2.jsx';
import DeleteConfirmationPopup from './albums/DeleteConfirmationPopup.jsx';
import InfoPopup from './albums/InfoPopup.jsx';
import { debounce } from 'lodash';
import { Toaster } from 'react-hot-toast';
import { showNotification } from './reusable/toasts/useNotification.jsx';

function MasterLayout() {
    const [tokenInfo, setTokenInfo] = useState({         // for refersh token
        isValidToken: true,
        message: ''
    });
    const [initSrcError, setInitSrcError] = useState({
        isError: false,
        message: '',
        tips: []
    });
    const [isMobileAlbumSidebarSkeletonLoading, setMobileAlbumSidebarSkeletonLoading] = useState(false);

    const location = useLocation();
    const hideMasterLayoutPlaybarRoute = ['/admin-panel/create-track', '/admin-panel/albums'];
    const [isAudioConflictPopUpHidden, setAudioConflictPopUpHidden] = useState(true);
    const [isPlayerNotSuppotedWarnPopUpHidden, setPlayerNotSuppotedWarnPopUpHidden] = useState(true);

    // -------------------------FROM TRACK SECTION ---------------------------

    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [isAudioLoaded, setAudioLoaded] = useState(false);
    const [isMobileSidebarExp, setMobileSidebarExp] = useState(false);
    const [isPlaybarExp, setPlaybarExp] = useState(false);
    const [isSidebarExpanded, setSidebarExpanded] = useState(false);
    const [isPlaybarTitleOverflow, setPlaybarTitleOverflow] = useState(false);
    const playbarTitleRef = useRef(null);
    const transitionTimeoutRef = useRef(null);
    const [extractedColor, setExtractedColor] = useState({
        primarySidebarBc: '',
        secondarySidebarBc: ''
    });
    const [audioSettings, setAudioSettings] = useState({
        autoplay: true,
        loopType: '2'   // 1 for single, 2 for albums
    })
    const [isSoundControlOverlayHidden, setSoundControlOverlayHidden] = useState(true);
    const [soundControlOverlayTimeoutId, setSoundControlOverlayTimeoutId] = useState(null);
    const [soundLevelBeforeMute, setSoundLevelBeforeMute] = useState(0);
    const [soundLevel, setSoundLevel] = useState(100);
    const [isUserInteractedWithTrack, setUserInteractedWithTrack] = useState(false);
    const [isAutoNavigated, setAutoNavigated] = useState(false);
    const [isPlaying, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState('00:00');
    const [audioDuration, setAudioDuration] = useState('00:00');
    const [audioSeekbarValue, setAudioSeekbarValue] = useState(0);
    const [isSeeking, setSeeking] = useState(false);
    const [isShakaSupported, setShakaSupported] = useState(true);

    const audioContextRef = useRef(null);
    const audioElementRef = useRef(null);
    const audioSorceRef = useRef(null);
    const gainNodeRef = useRef(null);
    const shakaPlayerRef = useRef(null);
    const fallbackAudioUrlRef = useRef(null);
    const playerConfRef = useRef({
        streaming: {
            bufferingGoal: 30,
            rebufferingGoal: 10,
            bufferBehind: 30,
            retryParameters: {
                maxAttempts: 5,
                baseDelay: 1000,
                backoffFactor: 2,
                fuzzFactor: 0.5
            },
            // smallGapLimit: 0.5,
            // jumpLargeGaps: true,
            stallThreshold: 2,
            durationBackoff: 0.5,
        },
        abr: {
            enabled: true,
            defaultBandwidthEstimate: 500000,  // 500kbps initial estimate
            switchInterval: 10,  // Switch bitrates every 10 seconds if needed
            bandwidthUpgradeTarget: 0.9,  // Upgrade if bandwidth is 90% of next level
            bandwidthDowngradeTarget: 0.7,  // Downgrade if bandwidth falls below 70% of current level
        },
        preferredAudioLanguage: 'en'
    });
    const streamTokensRef = useRef({
        accessToken: null,
        refreshToken: null
    });
    const abortControllerRef = useRef();

    // -------------------------FOR HANDING AUDIO Streaming ---------------------------

    const resetPlayer = () => {
        if (audioElementRef.current) audioElementRef.current.pause();
        if (shakaPlayerRef.current) shakaPlayerRef.current.unload();
        setPlaying(false);
        setCurrentTime('00:00');
        setAudioDuration('00:00');
        setAudioSeekbarValue(0);
    }
    const closeALbumSidebar = () => {
        setMobileSidebarExp(false);
        setSelectedAlbum(null);
        setSelectedTrack(null);
        setPlaybarExp(false);
        setSidebarExpanded(false);
        resetPlayer();
        resetAlbumAndTrackChanges();
    }
    const togglePlayPause = useCallback(async () => {
        try {
            if (isPlaying) {
                audioElementRef.current.pause();
            }
            else {
                await audioElementRef.current.play();
            }
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = isPlaying ? 'paused' : 'playing'
            }
            setPlaying(prev => !prev);
        } catch (error) {
            console.log('Error in toggle play pause: ', error);
        }
    }, [isPlaying]);
    const onSeeking = (value) => {
        const audio = audioElementRef.current;

        if (!audio.duration) return;

        if (!isSeeking) setSeeking(true);
        setCurrentTime(formatTime((value * audio.duration) / 100));
        setAudioSeekbarValue(value);
    }
    const onSeekEnd = (value) => {
        if (isSeeking) {
            const audio = audioElementRef.current;

            if (!audio.duration) return;
            audio.currentTime = (value * audio.duration) / 100;
            setSeeking(false);
        }
    }
    const changeAudioSetting = (key) => {
        const { loopType, autoplay } = audioSettings; // Destructure for cleaner code
        let newValues = {};
        const settingToggles = {
            loopType: () => (loopType === 1 ? 2 : 1),
            autoplay: () => !autoplay
        };

        if (settingToggles[key]) {
            newValues[key] = settingToggles[key]();
            if (key === 'loopType' && newValues[key] === 1) {
                newValues.autoplay = false;
            }
            if (key === 'autoplay' && newValues[key]) {
                newValues.loopType = 2;
            }
        } else {
            console.warn(`No toggle function defined for ${key}`);
            return;
        }
        setAudioSettings((prev) => {
            const newSettings = {
                ...prev,
                ...newValues
            };

            try {
                localStorage.setItem('audioSettings', JSON.stringify(newSettings));
            } catch (error) {
                console.error("Error saving audio settings to localStorage:", error);
            }

            return newSettings;
        });
    };
    const handleSoundMute = () => {
        if (soundLevel > 0) {
            setSoundLevelBeforeMute(soundLevel);
            setSoundLevel(0);
        }
        else {
            setSoundLevel(soundLevelBeforeMute || 50);
        }
        if (soundControlOverlayTimeoutId) {
            clearTimeout(soundControlOverlayTimeoutId)
            fadeOutSoundControlOverlay();
        };
    }
    const handleSoundlevel = (value) => {
        if (soundControlOverlayTimeoutId) clearTimeout(soundControlOverlayTimeoutId);
        setSoundLevel(value);
    }
    const handleSoundControlOverlayShow = () => {
        if (soundControlOverlayTimeoutId) {
            clearTimeout(soundControlOverlayTimeoutId);
        }
        setSoundControlOverlayHidden(false);
        fadeOutSoundControlOverlay();
    }
    const fadeOutSoundControlOverlay = () => {
        const id = setTimeout(() => {
            setSoundControlOverlayHidden(true);
        }, 4000)
        setSoundControlOverlayTimeoutId(id);
    }
    const handleAudioConflictPopUpCheckboxChange = (value) => {
        localStorage.setItem('keepAudioConflictInfoPopUpHidden', value);
    }

    const debounceLoadMPD = useCallback(debounce(async (url) => {
        try {
            await shakaPlayerRef.current.load(url, 0, 'application/dash+xml');
            // logic of play track on load and other features is in useEffects
        }
        catch (error) {
            if (error.code === 7000) return;

            console.log("Error occured while loading mpd : ", error);
            handleShakaPlayerError(error);
        }
    }, 1000), [])
    const debounceDownloadTrack = useCallback(debounce(async (url, audioSettings, userInteracted) => {
        try {
            const audio = audioElementRef.current;

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const response = await downloadTrackWithAuth(url, {
                method: 'GET',
                credentials: 'include',
                signal: abortControllerRef.current.signal
            });
            if (response.isRedirect) {
                return setTokenInfo({ isValidToken: false, message: response.message });
            }
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            fallbackAudioUrlRef.current = objectUrl;

            audio.src = objectUrl;
            await audio.load();

            if (audioSettings.autoplay || userInteracted) {
                await audio.play();
                setPlaying(true);
                setUserInteractedWithTrack(false);
                setAutoNavigated(false);
            }
            setAudioLoaded(true);
        }
        catch (error) {
            if (error instanceof FetchWithAuthError) {
                const err = error.errorObj.errors;
                toast.error(err[Object.keys(err)[0]].message, toastOption);
                console.log('Error in fallback mechanism :', err);
            }
            else if (error.name === 'TypeError') {
                toast.error('Network error: Please check your internet connection.', toastOption);
            }
            else if (error.name === 'AbortError') {
                return console.log(`Request aborted: ${error.name} while switching tracks.`);
            }
            else {
                toast.error('Unexpected error occured while updating track.', toastOption);
            }
            setSelectedTrack(null);
        }
    }, 1000), [])

    // -------------------------Use Callbacks -----------------------------------------------
    const handleTrackClick = useCallback(async (track, userInteracted = false, autoNavigated = false) => {
        const audio = audioElementRef.current;
        if (selectedTrack && selectedTrack._id === track._id) {
            audio.currentTime = 0;
            setAudioSeekbarValue(0);
            setCurrentTime('00:00');

            if (!audioSettings.autoplay && autoNavigated) {
                setPlaying(false);
                return;
            }
            audio.play();
            return;
        }
        setSelectedTrack(track);
        setExtractedColor({
            primarySidebarBc: track.palette.DarkVibrant,
            secondarySidebarBc: track.palette.LightVibrant,
            selectedTrackBc: track.palette.Vibrant
        })

        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const url = isShakaSupported
            ? `http://localhost:8080/api/stream/${track._id}/manifest`
            : `http://localhost:8080/api/media/audio/download/${encodeURIComponent(track.audio.name)}`;
        try {
            setCurrentTime('00:00');
            setAudioDuration('00:00');
            setAudioSeekbarValue(0);
            setPlaying(false);
            setAudioLoaded(false);

            setUserInteractedWithTrack(userInteracted);
            setAutoNavigated(autoNavigated);


            if (isShakaSupported) {
                await shakaPlayerRef.current.unload();
                debounceLoadMPD(url);               // to handle shakaPlayer
            }
            else {                                  // to handle fallback mechanism
                audio.currentTime = 0;
                audio.pause();
                debounceDownloadTrack(url, audioSettings, userInteracted);
            }
        } catch (error) {
            console.log("Error in handle track click : ", error);
            toast.error('Unexpected error occured while playing track.', toastOption);
        }

    }, [selectedTrack, audioSettings, isShakaSupported]);

    const navigateTo = useCallback((value = 1, userInteracted, autoNavigated = false) => {
        if (!selectedAlbum || !selectedTrack) return;
        const tracks = selectedAlbum.track;
        const index = tracks.findIndex(track => track._id === selectedTrack._id);
        let navigatedTrackIndex;
        if (index === 0 && value === -1) {
            navigatedTrackIndex = tracks.length - 1;
        }
        else if (index === tracks.length - 1 && value === 1) {
            navigatedTrackIndex = 0;
        }
        else {
            navigatedTrackIndex = index + value;
        }
        const navigatedTrack = tracks[navigatedTrackIndex];
        handleTrackClick(navigatedTrack, userInteracted, autoNavigated);
    }, [selectedAlbum, handleTrackClick]);

    const handleShakaPlayerError = useCallback(async (error, retryCount = 0) => {
        const constants = {
            invalidUserTokenRange: {
                MIN: 10,
                MAX: 13,
                MAX_RETRIES: 1,
                STREAM_TOKEN_EXPIRED: 15
            }
        }
        if (error instanceof shaka.util.Error && error.context) {

            const context = error.context;
            if (context.serverError) {
                const serverError = context.serverError;
                const audio = audioElementRef.current;
                const shakaPlayer = shakaPlayerRef.current;
                if (serverError.code >= constants.invalidUserTokenRange.MIN && serverError.code <= constants.invalidUserTokenRange.MAX) {
                    setTokenInfo({ isValidToken: false, message: serverError.message });
                }
                else if (serverError.code === constants.invalidUserTokenRange.STREAM_TOKEN_EXPIRED && audio && shakaPlayer && retryCount < constants.invalidUserTokenRange.MAX_RETRIES) {
                    try {
                        const uri = shakaPlayer.getAssetUri();
                        const currentTime = audio.currentTime;

                        setAudioLoaded(false);
                        await shakaPlayer.unload();
                        await shakaPlayer.load(uri, currentTime, 'application/dash+xml');

                        console.log('Shakaplayer reloaded.');
                    }
                    catch (error) {
                        console.log('Recursive', retryCount);
                        handleShakaPlayerError(error, retryCount + 1);
                    }
                    return;
                }
                else {
                    console.log('Unexpected server error : ', context.serverError?.message);
                    toast.error(context.serverError?.message, toastOption);
                }
            }
            else if (context.clientError && context.clientError.name === 'TypeError') {
                console.log('Unexpected client error : ', context.clientError?.message);
                toast.error('Network error: Please check your internet connection.', toastOption);
            }
            else {
                console.log('Unexpected error occured while playing track.');
                toast.error('Unexpected error occured while playing track.', toastOption);
            }
        }
        else {
            console.log('Unexpected error occured while playing track.');
            toast.error('Unexpected error occured while playing track.', toastOption);
        }
        resetPlayer();
        setSelectedTrack(null);
    }, []);

    //-------------------------------------for edit album related state and methods------------------------------
    const [isAlbumEditOverlayHidden, setAlbumEditOverlayHidden] = useState(true);
    const [isGenreListHidden, setGenreListHidden] = useState(true);
    const [isEditAlbumInfoDialogHidden, setEditAlbumInfoDialogHidden] = useState(true);

    const [updatedAlbumData, setUpdatedALbumData] = useState({});
    const [selectedAlbumImgUrl, setSelectedAlbumImgUrl] = useState(null);

    const [isListLoaded, setListLoaded] = useState(false);
    const [isAlbumProcessing, setAlbumProcessing] = useState(false);

    const [albums, setAlbums] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [genres, setGenres] = useState([]);

    const albumImageInputRef = useRef(null);

    const onUpdateAlbum = async () => {
        if (Object.keys(updatedAlbumData).length === 0) {
            toast.info("Nothing new to save! Go ahead, make some edits.", toastOption);
            return;
        }
        const formData = new FormData();
        for (const field in updatedAlbumData) {
            formData.append(field, updatedAlbumData[field]);
        }
        try {
            setAlbumProcessing(true);
            const res = await fetchWithAuth(`http://localhost:8080/api/albums/${selectedAlbum._id}`, {
                method: 'PATCH',
                credentials: 'include',
                body: formData
            });
            if (res.status >= 400) {
                throw new FetchWithAuthError(res.data, 'http error');
            }
            if (res.isRedirect) {
                setTokenInfo({ isValidToken: false, message: res.data });
                return;
            }
            setAlbumProcessing(false);
            toast.success(`Edits saved! The album has been updated with your changes.`, toastOption);

            const newAlbums = [...albums];
            const index = newAlbums.findIndex((ele) => ele._id === res.data._id);
            if (res.data.status === 'unpublished') {
                newAlbums.splice(index, 1);
                closeALbumSidebar();
            }
            else if (res.data.status === 'published') {
                newAlbums.splice(index, 1, {
                    ...newAlbums[index],
                    ...res.data
                })
                setSelectedAlbum(prev => {
                    return { ...prev, ...res.data }
                });
            }
            setAlbums(newAlbums);
            setUpdatedALbumData({});
            setSelectedAlbumImgUrl(null);
        }
        catch (error) {
            if (error instanceof FetchWithAuthError) {
                const err = error.errorObj;
                const errMessages = extractDataFromObjOfObj(err.errors, 'message');
                let delay = 0;
                for (const key in errMessages) {
                    toast.error(errMessages[key], { ...toastOption, delay });
                    delay += 400;
                }
            }
            else if (error.name === 'TypeError') {
                toast.error('Network error: Please check your internet connection.', toastOption);
            }
            else {
                console.log(error);
                toast.error('Error occured while creating track', toastOption);
            }
            console.log(error.errorObj);
            setAlbumProcessing(false);
        }
    }
    const manupulateUpdatedAlbumData = (oldValue, newValue, key) => {
        if (oldValue !== newValue) {
            setUpdatedALbumData((prev) => {
                return {
                    ...prev,
                    [key]: newValue
                }
            })
        }
        else {
            setUpdatedALbumData(removeKeyFromObj(updatedAlbumData, key));
        }
    }
    const findNameById = (arr = [], id) => {
        return arr.find(obj => obj._id === id)?.name;
    }
    const onGenreChange = (value) => {
        manupulateUpdatedAlbumData(selectedAlbum.genre._id, value, 'genre');
    }
    const onAlbumImgChange = (e) => {
        handleImgFile(e, (file, url, error) => {
            if (error) {
                toast.error(error, toastOption);
                return;
            }
            setSelectedAlbumImgUrl(url);
            setUpdatedALbumData((prev) => {
                return {
                    ...prev,
                    ['albumImage']: file
                }
            })
        })
    }
    const onResetAlbumImgBtnClick = () => {
        setUpdatedALbumData(removeKeyFromObj(updatedAlbumData, 'albumImage'));
        setSelectedAlbumImgUrl(null);
    }
    const restoreDefaultUpdatedAlbum = () => {
        if (Object.keys(updatedAlbumData).length === 0) {
            toast.info("Nothing to restore - you're already at default!", toastOption);
            return;
        }
        setUpdatedALbumData({});
        if (selectedAlbumImgUrl) setSelectedAlbumImgUrl(null);
    }
    const onAlbumImgEditBtnClick = (albumImgInputRef = {}) => {
        if (albumImgInputRef.current) {
            albumImgInputRef.current.click();
        }
    }
    const onAlbumTitleChange = (e) => {
        manupulateUpdatedAlbumData(selectedAlbum.title, e.target.value, 'title');
    }
    const onAlbumTitleBlur = () => {
        if ('title' in updatedAlbumData && (updatedAlbumData.title.trim() === '' || updatedAlbumData.title.trim() === selectedAlbum.title)) {
            setUpdatedALbumData(removeKeyFromObj(updatedAlbumData, 'title'));
        }
    }
    const onEditAlbumInfoBtnClick = (e) => {
        e.stopPropagation();
        setEditAlbumInfoDialogHidden(prev => !prev)
    }
    const onEditAlbumOverlayClick = () => {
        setEditAlbumInfoDialogHidden(true);
    }

    //-------------------------------------for edit track related state and methods------------------------------
    const [trackForEdit, setTrackForEdit] = useState(null);
    const [discardPopupConfig, setDiscardPopupConfig] = useState({
        onCancel: () => {
            setDiscardPopupHidden(true);
        },
        onDiscard: () => { }
    });

    const [isDiscardPopupHidden, setDiscardPopupHidden] = useState(true);
    const [isRestoreDefaultPopupHidden, setRestoreDefaultPopupHidden] = useState(true);

    const [isTrackListHidden, setTrackListHidden] = useState(true);
    const [isLanguageListHidden, setLanguageListHidden] = useState(true);

    const [updatedTrackData, setUpdatedTrackData] = useState({});
    const [featuredArtists, setFeaturedArtists] = useState([]);              // added when onTrackClickForEdit calls
    const [selectedTrackImgUrl, setSelectedTrackImgUrl] = useState(null);

    const trackImageInputRef = useRef(null);
    const featuredArtistInputRef = useRef(null);


    // this method wil reset all state which is related to edit album and track
    const resetAlbumAndTrackChanges = () => {

        // reset album section
        setAlbumEditOverlayHidden(true);

        // restoreDefaultUpdatedAlbum
        setUpdatedALbumData({});
        if (selectedAlbumImgUrl) setSelectedAlbumImgUrl(null);

        setGenreListHidden(true);
        setEditAlbumInfoDialogHidden(true);

        setRestoreDefaultPopupHidden(true);
        setDiscardPopupHidden(true);

        setDiscardPopupConfig({
            onCancel: () => {
                setDiscardPopupHidden(true);
            },
            onDiscard: () => { }
        })

        // ---------- reset track section ---------------
        setTrackListHidden(true);
        setLanguageListHidden(true);

        restoreAllUpdatedTrackData();

        setTrackForEdit(null);
        setFeaturedArtists([]);

        // ------------ delete tracks and album related state ---------------
        setSelectModeEnableForDeleteTrack(false);

        setDeleteTrackConfirmationPopupHidden(true);
        setDeleteAlbumConfirmationPopupHidden(true);

        setDeleteTrackConfirmationPopupConfig({
            onCancel: () => {
                setDeleteTrackConfirmationPopupHidden(true);
            },
            onDelete: () => { }
        });
        setDeleteAlbumConfirmationPopupConfig({
            onCancel: () => {
                setDeleteAlbumConfirmationPopupHidden(true);
            },
            onDelete: () => { }
        });

        setTracksForDelete([]);
    }

    // for close overlay
    const closeEditAlbum = () => {
        if (Object.keys(updatedAlbumData).length > 0) {
            setDiscardPopupHidden(false);
            setDiscardPopupConfig(prev => {
                return {
                    ...prev,
                    onDiscard: () => {
                        restoreDefaultUpdatedAlbum();
                        setDiscardPopupHidden(true);
                        setAlbumEditOverlayHidden(true);

                        setTracksForDelete([]);
                        setSelectModeEnableForDeleteTrack(false);
                    }
                }
            })
        }
        else {
            setAlbumEditOverlayHidden(true);

            setTracksForDelete([]);
            setSelectModeEnableForDeleteTrack(false);
        }
    }
    const backToEditAlbum = () => {
        if (Object.keys(updatedTrackData).length > 0) {
            setDiscardPopupHidden(false);
            setDiscardPopupConfig(prev => {
                return {
                    ...prev,
                    onDiscard: () => {
                        restoreAllUpdatedTrackData();
                        setTrackForEdit(null);
                        setDiscardPopupHidden(true);
                    }
                }
            })
        }
        else {
            setTrackForEdit(null);
        }
    }
    const onSwitchTrack = (id) => {
        const switchedTrack = selectedAlbum.track.find((track) => track._id === id);
        setTrackForEdit(switchedTrack);
        setFeaturedArtists(switchedTrack.featuredArtists);
    }
    const onSelectTrackChange = (id) => {
        if (Object.keys(updatedTrackData).length > 0) {

            setDiscardPopupHidden(false);
            setDiscardPopupConfig(prev => {

                return {
                    ...prev,
                    onDiscard: () => {
                        restoreAllUpdatedTrackData();
                        onSwitchTrack(id);
                        setDiscardPopupHidden(true);
                    }
                }
            })
        }
        else {
            onSwitchTrack(id);
        }
    }

    // for restore default track data or cancel
    const showRestoreDefaultPopup = () => {
        if (Object.keys(updatedTrackData).length === 0) {
            toast.info("Nothing to restore - you're already at default!", toastOption);
            return;
        }
        setRestoreDefaultPopupHidden(false);
    }
    const hideRestoreDefaultPopup = () => {
        setRestoreDefaultPopupHidden(true);
    }
    const restoreSomeUpdatedTrack = (keys) => {
        const newKeys = [...keys];
        if (newKeys.includes('trackFile')) {
            newKeys.push('duration');
            resetTrackAudio();
        }
        if (newKeys.includes('trackImage')) {
            setSelectedTrackImgUrl(null);
        }
        if (newKeys.includes('featuredArtists')) {
            setFeaturedArtists(trackForEdit.featuredArtists);
        }
        setUpdatedTrackData(removeKeysFromObj(updatedTrackData, ...newKeys));
        setRestoreDefaultPopupHidden(true);
    }
    const restoreAllUpdatedTrackData = () => {
        setUpdatedTrackData({});
        setFeaturedArtists(trackForEdit?.featuredArtists || []);
        if (selectedTrackImgUrl) setSelectedTrackImgUrl(null);
        if (editTrackAudioSrc) resetTrackAudio();
    }
    const onUpdateTrack = async () => {
        if (Object.keys(updatedTrackData).length === 0) {
            toast.info("Nothing new to save! Go ahead, make some edits.", toastOption);
            return;
        }
        const formData = new FormData();
        for (const field in updatedTrackData) {

            if (field === 'featuredArtists') {
                formData.append(field, JSON.stringify(updatedTrackData[field]));
                continue;
            }
            formData.append(field, updatedTrackData[field]);
        }

        try {
            setAlbumProcessing(true);
            const res = await fetchWithAuth(`http://localhost:8080/api/tracks/${trackForEdit._id}`, {
                method: 'PATCH',
                credentials: 'include',
                body: formData
            });
            if (res.status >= 400) {
                throw new FetchWithAuthError(res.data, 'http error');
            }
            if (res.isRedirect) {
                setTokenInfo({ isValidToken: false, message: res.data });
                return;
            }
            restoreAllUpdatedTrackData();

            const tracks = [...selectedAlbum.track];
            const index = tracks.findIndex(track => track._id === res.data._id);
            let albumDuration = selectedAlbum.albumDuration;

            if (res.data.status === 'unpublished') {
                albumDuration -= tracks[index].duration;
                tracks.splice(index, 1);

                if (selectedTrack && selectedTrack._id === trackForEdit._id) {
                    resetPlayer();
                    setSelectedTrack(null);
                    setPlaybarExp(false);
                }
                setTrackForEdit(null);
                setFeaturedArtists([]);
            }
            else if (res.data.status === 'published') {
                let formattedTitle = res.data.name;

                if (res.data.featuredArtists.length > 0) {
                    formattedTitle += ' ft. ' + res.data.featuredArtists.join(', ');
                }
                tracks.splice(index, 1, {
                    ...tracks[index],
                    ...res.data,
                    formattedTitle,
                });
                setFeaturedArtists(res.data.featuredArtists);

                if (trackForEdit) {
                    setTrackForEdit(prev => {
                        return {
                            ...prev,
                            ...res.data,
                            formattedTitle,
                        }
                    })
                }
                if (selectedTrack && selectedTrack._id === trackForEdit._id) {
                    setSelectedTrack(prev => {
                        return {
                            ...prev,
                            ...res.data,
                            formattedTitle
                        }
                    })
                }
            }

            setSelectedAlbum(prev => {
                return {
                    ...prev,
                    track: tracks,
                    albumDuration
                }
            })
            setAlbumProcessing(false);
            toast.success(`Edits saved! The track has been updated with your changes.`, toastOption);
        }
        catch (error) {
            if (error instanceof FetchWithAuthError) {
                const err = error.errorObj;
                const errMessages = extractDataFromObjOfObj(err.errors, 'message');
                let delay = 0;
                for (const key in errMessages) {
                    toast.error(errMessages[key], { ...toastOption, delay });
                    delay += 400;
                }
            }
            else if (error.name === 'TypeError') {
                toast.error('Network error: Please check your internet connection.', toastOption);
            }
            else {
                toast.error('Unexpected error occured while updating track', toastOption);
            }
            console.log(error);
            setAlbumProcessing(false);
        }
    }

    // general method for edit track
    const manupulateUpdatedTrackData = (oldValue, newValue, key) => {
        if (oldValue !== newValue) {
            setUpdatedTrackData((prev) => {
                return {
                    ...prev,
                    [key]: newValue
                }
            })
        }
        else {
            setUpdatedTrackData(removeKeyFromObj(updatedTrackData, key));
        }
    }
    const onTrackClickForEdit = (track) => {
        setTrackForEdit(track);
        setFeaturedArtists(track.featuredArtists);
    }
    const onTrackImgChange = (e) => {
        handleImgFile(e, (file, url, error) => {
            if (error) {
                return toast.error(error, toastOption);
            }
            setSelectedTrackImgUrl(url);
            setUpdatedTrackData(prev => {
                return {
                    ...prev,
                    'trackImage': file
                }
            })
        });
    }
    const onResetTrackImageBtnClick = () => {
        setUpdatedTrackData(removeKeyFromObj(updatedAlbumData, 'trackImage'));
        setSelectedTrackImgUrl(null);
    }
    const onTrackTitleChange = (e) => {
        manupulateUpdatedTrackData(trackForEdit.name, e.target.value, 'name');
    }
    const onTrackTitleBlur = () => {
        if ('name' in updatedTrackData && updatedTrackData.name === '') {
            setUpdatedTrackData(removeKeyFromObj(updatedTrackData, 'name'));
        }
    }
    const addFeaturedArtist = (inputRef) => {
        const value = !inputRef.current ? '' : inputRef.current.value.trim();
        if (value === '') {
            return;
        }
        if (featuredArtists.length > 12) {
            toast.warning('Maximum feature artist limit exceeded.', toastOption)
            return
        }
        if (featuredArtists.includes(value)) {
            toast.info('This name has already been entered.', toastOption)
            return;
        }
        setFeaturedArtists(prev => {
            return [
                ...prev,
                value
            ]
        })
        inputRef.current.value = '';
    }
    const removeFeaturedArtist = (index) => {
        const newFtArtist = [...featuredArtists];
        newFtArtist.splice(index, 1);
        setFeaturedArtists(newFtArtist);
    }
    const onFeaturedArtistKeyDown = (e, inputRef) => {
        if (e.key === 'Enter') {
            addFeaturedArtist(inputRef);
        }
    }
    const onTrackLanguageChange = (id) => {
        manupulateUpdatedTrackData(trackForEdit.language._id, id, 'language');
    }

    // audio related stats and ref
    const [editTrackPlaybackStates, setEditTrackPlaybackStates] = useState({
        curTime: '00:00',
        duration: '00:00',
        isPlaying: false,
        seekVal: 0
    });
    const [editTrackAudioSrc, setEditTrackAudioSrc] = useState(null);
    const editTrackAudioElementRef = useRef();
    const trackAudioInputRef = useRef();

    // audio related method
    const onTrackAudioChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            toast.error('No file selected.', toastOption);
            return;
        }
        if (!file.type.startsWith('audio/')) {
            toast.error('Selected file must be an audio.', toastOption);
            return;
        }
        setUpdatedTrackData(prev => {
            return {
                ...prev,
                trackFile: file
            }
        })
        const url = URL.createObjectURL(file);
        setEditTrackAudioSrc(url);

        if (selectedTrack) {
            const keepAudioConflictInfoPopUpHidden = getItemFromLocalStorage('keepAudioConflictInfoPopUpHidden', 'bool');
            if (!keepAudioConflictInfoPopUpHidden) {
                setAudioConflictPopUpHidden(false);
            };

            resetPlayer();
            setSelectedTrack(null);
            setPlaybarExp(false);
        }
    }
    const onResetTrackAudioBtnClick = () => {
        setUpdatedTrackData(removeKeysFromObj(updatedTrackData, 'trackFile', 'duration'));
        resetTrackAudio();
    }
    const resetTrackAudio = () => {
        setEditTrackPlaybackStates({
            curTime: '00:00',
            duration: '00:00',
            isPlaying: false,
            seekVal: 0
        });
        if (editTrackAudioElementRef.current) {
            editTrackAudioElementRef.current.pause();
            editTrackAudioElementRef.current = null;
        }
        setEditTrackAudioSrc(null);
    }
    const onPlayPauseBtnClick = useCallback(async () => {
        try {
            const audio = editTrackAudioElementRef.current;
            if (!audio) return;
            if (editTrackPlaybackStates.isPlaying) {
                audio.pause();
            }
            else {
                await audio.play()
            }
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = editTrackPlaybackStates.isPlaying ? 'paused' : 'playing'
            }
            setEditTrackPlaybackStates(prev => {
                return {
                    ...prev,
                    isPlaying: !prev.isPlaying
                }
            })
        }
        catch (error) {
            console.log(error);
            toast.error('Sorry, Audio can not be play, please select audio again.', toastOption);
        }
    }, [editTrackPlaybackStates.isPlaying]);

    const onEditTrackAudioSeek = (value) => {
        const audio = editTrackAudioElementRef.current;
        if (!audio.duration) return;
        setEditTrackPlaybackStates(prev => {
            return {
                ...prev,
                seekVal: value
            }
        })
        const time = (value * audio.duration) / 100;
        audio.currentTime = time;
    }

    //--------------------------- delete tracks section --------------------------------------------
    const [isSelectModeEnableForDeleteTrack, setSelectModeEnableForDeleteTrack] = useState(false);
    const [tracksForDelete, setTracksForDelete] = useState([]);
    const [isDeleteTrackConfirmationPopupHidden, setDeleteTrackConfirmationPopupHidden] = useState(true);
    const [deleteTrackConfirmationPopupConfig, setDeleteTrackConfirmationPopupConfig] = useState({
        onCancel: () => {
            setDeleteTrackConfirmationPopupHidden(true);
        },
        onDelete: () => { }
    });
    const [infoPopupForTrackDeletionConfig, setInfoPopupForTrackDeletionConfig] = useState({//display pop-up if selected track for delete is currently playing
        isHidden: true,
        onOk: () => {
            setInfoPopupForTrackDeletionConfig(prev => {
                return {
                    ...prev,
                    isHidden: true
                }
            })
        }
    });

    const deleteTracks = async () => {
        try {
            if (selectedTrack && tracksForDelete.includes(selectedTrack._id)) {
                resetPlayer();
                setSelectedTrack(null);
                setPlaybarExp(false);
                setInfoPopupForTrackDeletionConfig(prev => {
                    return {
                        ...prev,
                        isHidden: false
                    }
                })
            }

            setAlbumProcessing(true);
            const res = await fetchWithAuth('http://localhost:8080/api/tracks', {
                method: 'DELETE',
                credentials: 'include',
                body: JSON.stringify({ trackIds: tracksForDelete }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (res.status >= 400) {
                throw new FetchWithAuthError(res.data, 'http error');
            }
            if (res.isRedirect) {
                setTokenInfo({ isValidToken: false, message: res.message });
                return;
            }
            setAlbumProcessing(false);

            setTracksForDelete([]);
            setSelectModeEnableForDeleteTrack(false);
            setDeleteTrackConfirmationPopupHidden(true);
            setDeleteTrackConfirmationPopupConfig(prev => {
                return {
                    ...prev,
                    onDelete: () => { }
                }
            })

            const tracks = [...selectedAlbum.track];
            const newTracks = tracks.filter(track => !tracksForDelete.includes(track._id));
            setSelectedAlbum(prev => {
                return {
                    ...prev,
                    track: newTracks
                }
            });

            let message = `We've cleared out ${res.data.count} tracks for you. However, certain entries could not be processed due to invalid or missing identifiers, please try again.`;
            if (res.data.count === tracksForDelete.length) {
                toast.success(`We've cleared out ${res.data.count} tracks for you.`, toastOption);
                return;
            }
            toast.info(message, toastOption);
        }
        catch (error) {
            let message;
            if (error instanceof FetchWithAuthError) {
                const err = error.errorObj;
                const errMessages = extractDataFromObjOfObj(err.errors, 'message');

                for (const key in errMessages) {
                    message = errMessages[key];
                }
            }
            else if (error.name === 'TypeError') {
                message = 'Network error: Please check your internet connection.';
            }
            else {
                message = 'Unexpected error occured while deleting track.';
            }

            toast.error(message, toastOption);
            setAlbumProcessing(false);

            console.log(error);
        }
    }
    const onDeleteTrackBtnClick = () => {
        setDeleteTrackConfirmationPopupHidden(false);
        setDeleteTrackConfirmationPopupConfig(prev => {
            return {
                ...prev,
                onDelete: deleteTracks
            }
        })
    }
    const toggleSelectAllTracksForDelete = () => {
        const tracks = [...selectedAlbum.track];

        if (tracksForDelete.length > 0) {
            setTracksForDelete([]);
        }
        else {
            setTracksForDelete(tracks.map(track => track._id));
        }
    }
    const onTrackClickForDelete = (track) => {
        const id = track._id;

        const newTracksForDelete = [...tracksForDelete];
        if (newTracksForDelete.includes(id)) {
            newTracksForDelete.splice(newTracksForDelete.indexOf(id), 1);
        }
        else {
            newTracksForDelete.push(id);
        }
        setTracksForDelete(newTracksForDelete);
    }
    const toggleSelectModeForDeleteTrack = () => {
        setSelectModeEnableForDeleteTrack(prev => !prev);
        setTracksForDelete([]);
    }

    //--------------------------- delete album section --------------------------------------------
    const [isDeleteAlbumConfirmationPopupHidden, setDeleteAlbumConfirmationPopupHidden] = useState(true);
    const [deleteAlbumConfirmationPopupConfig, setDeleteAlbumConfirmationPopupConfig] = useState({
        onCancel: () => {
            setDeleteAlbumConfirmationPopupHidden(true);
        },
        onDelete: () => { }
    });
    const deleteAlbum = async () => {
        try {
            setAlbumProcessing(true);

            if (selectedTrack) {
                resetPlayer();
                setSelectedTrack(null);
                setPlaybarExp(false);
            }

            const albumId = selectedAlbum._id;
            const res = await fetchWithAuth(`http://localhost:8080/api/albums/${albumId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.status >= 400) {
                throw new FetchWithAuthError(res.data, 'http error');
            }
            if (res.isRedirect) {
                setTokenInfo({ isValidToken: false, message: res.data });
                return;
            }
            setAlbumProcessing(false);

            setSelectedAlbum(null);
            setMobileSidebarExp(false);
            setSidebarExpanded(false);

            const newAlbums = [...albums];
            const albumIndex = newAlbums.findIndex(album => album._id === albumId);
            newAlbums.splice(albumIndex, 1);
            setAlbums(newAlbums);

            setDeleteAlbumConfirmationPopupConfig(prev => {
                return {
                    ...prev,
                    onDelete: () => { }
                }
            })
            setDeleteAlbumConfirmationPopupHidden(true);

            toast.success("Album and all associated tracks have been successfully deleted.", toastOption);
        }
        catch (error) {
            let message;
            if (error instanceof FetchWithAuthError) {
                const err = error.errorObj;
                const errMessages = extractDataFromObjOfObj(err.errors, 'message');

                for (const key in errMessages) {
                    message = errMessages[key];
                }
            }
            else if (error.name === 'TypeError') {
                message = 'Network error: Please check your internet connection.';
            }
            else {
                message = 'Unexpected error occured while deleting album.';
            }

            toast.error(message, toastOption);
            setAlbumProcessing(false);

            console.log(error);
        }
    }
    const onDeleteAlbumBtnClick = () => {
        setDeleteAlbumConfirmationPopupHidden(false);
        setDeleteAlbumConfirmationPopupConfig(prev => {
            return {
                ...prev,
                onDelete: deleteAlbum
            }
        })
    }

    // callback for genre and language
    const getGenresAndLanguages = useCallback(async () => {
        try {
            setListLoaded(false);
            // fetch res at intial stages
            const genreData = await fetchWithAuth('http://localhost:8080/api/genres', {
                method: 'get',
                credentials: 'include'
            })
            const languageData = await fetchWithAuth('http://localhost:8080/api/languages', {
                method: 'get',
                credentials: 'include'
            })
            if (genreData.status >= 400) {
                throw new FetchWithAuthError(genreData, 'http error');
            }
            else if (languageData.status >= 400) {
                throw new FetchWithAuthError(languageData, 'http error');
            }
            // handle response of server
            if (genreData.isRedirect || languageData.isRedirect) {
                const message = genreData.message || languageData.data;
                setTokenInfo({ isValidToken: false, message });
                return;
            }
            setListLoaded(true);
            setGenres(genreData.data);
            setLanguages(languageData.data);
        }
        catch (error) {
            let message = '';
            if (error.name === 'TypeError') {
                message = 'Network error: Please check your internet connection.';
            }
            else if (error instanceof FetchWithAuthError) {
                let errors = error?.errorObj?.data?.errors;
                for (const key in errors) {
                    message = errors[key]?.message;
                }
            }
            else {
                console.log(error);
                message = 'An error occurred while fetching languages and genres.'
            }
            toast.error(message, toastOption);
            setListLoaded(false);
        }
    }, []);

    const [socketMessage, setSocketMessage] = useState();

    // -------------------------Use effect & Layout Effect -----------------------------------------------
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');
        ws.addEventListener('open', () => {
            console.log('Websocket connected.');
        })

        ws.addEventListener('message', (event) => {
            const { name, status, data, collection, process } = JSON.parse(event.data);
            console.log(`${name} came from ${collection} collection via webSocket.`);
            const allowedStatus = [processStates.COMPLETED, processStates.FAILED];

            if (allowedStatus.includes(status)) {
                const message = `${process.charAt(0).toUpperCase() + process.slice(1)} processing for ${name}'s ${collection.slice(0, -1)} has ${status === 'completed' ? 'been completed' : 'failed'}.`;

                let link = status === processStates.COMPLETED ? {
                    icon: <IoAlbumsOutline />,
                    title: 'Album',
                    to: '/admin-panel/albums',
                    notificationIcon: <IoCheckmarkCircleSharp />
                } : {
                    icon: <BsHddRack />,
                    title: 'Processing overview',
                    to: '/admin-panel/processing-overview',
                    notificationIcon: <IoCloseCircleSharp />
                }
                const links = [link, { icon: <IoMdNotificationsOutline /> }];
                showNotification({ message, links, notificationIcon: link.notificationIcon });
            }
            setSocketMessage({ collection, data });
        })

        ws.addEventListener('close', () => {
            console.log('Websocket disconnected.');
        })
        ws.addEventListener('error', (error) => {
            console.log('WebSocket error:', error);
        })
    }, [])                                  // for socket message from server
    useLayoutEffect(() => {
        let resizeObserever;
        if (playbarTitleRef.current && selectedTrack) {
            const checkOverflow = () => {
                if (!isPlaybarExp) return;
                const tempSpan = document.createElement('span');
                tempSpan.style.visibility = 'hidden';
                tempSpan.style.position = 'absolute';
                tempSpan.style.whiteSpace = 'nowrap';
                tempSpan.textContent = selectedTrack.formattedTitle;
                document.body.appendChild(tempSpan);

                const textWidth = tempSpan.offsetWidth;
                document.body.removeChild(tempSpan);
                const containerWidth = playbarTitleRef.current.offsetWidth;
                setPlaybarTitleOverflow(textWidth > containerWidth);
            }

            resizeObserever = new ResizeObserver(() => {
                if (transitionTimeoutRef.current) {
                    clearTimeout(transitionTimeoutRef);
                }
                transitionTimeoutRef.current = setTimeout(checkOverflow, 2200);
            })

            resizeObserever.observe(playbarTitleRef.current);
            return () => {
                resizeObserever.disconnect();
                if (transitionTimeoutRef.current) {
                    clearTimeout(transitionTimeoutRef.current);
                }

            }
        }
    }, [selectedTrack, isPlaybarExp]);      // for marquee effect for mobile only 
    useEffect(() => {
        const onLoadedMetadata = () => {
            setAudioDuration(formatTime(audioElementRef.current.duration));
            if (fallbackAudioUrlRef.current) {
                URL.revokeObjectURL(fallbackAudioUrlRef.current);
                console.log('Fallback audio url revoked.');
            };
        }
        const onErrorEvent = async (e) => {
            console.log('Error occured while playing segments : ', e.detail);
            const error = e.detail;
            handleShakaPlayerError(error);
        };
        const handleBuffering = (event) => {
            setBufferingState(event.buffering);
            console.log(event.buffering);
        };

        //Functions to handle audio streaming playback
        const streamingConstants = {
            ACCESS_TOKEN_EXPIRED: 11,
            STREAM_TOKEN_EXPIRED: 15,
            MAX_RETRIES: 2  // 0 to 2
        }
        const createShakaError = (severity, category, code, serverError = null, clientError = null) => {
            const error = new shaka.util.Error(severity, category, code);
            if (serverError || clientError) {
                error.context = {
                    serverError: serverError ? {
                        code: serverError.code,
                        message: serverError?.errors[Object.keys(serverError.errors)[0]].message,
                        detail: serverError?.errors[Object.keys(serverError.errors)[0]]
                    } : null,
                    clientError: clientError ? {
                        name: clientError.name,
                        message: clientError.message,
                        stack: clientError.stack,
                        detail: error
                    } : null
                };
            }
            return error;
        }
        const handleHttpError = (status, serverError) => {
            switch (status) {
                case 400:
                    return createShakaError(
                        shaka.util.Error.Severity.CRITICAL,
                        shaka.util.Error.Category.NETWORK,
                        shaka.util.Error.Code.BAD_HTTP_STATUS,
                        serverError
                    );
                case 401:
                    return createShakaError(
                        shaka.util.Error.Severity.CRITICAL,
                        shaka.util.Error.Category.NETWORK,
                        shaka.util.Error.Code.HTTP_ERROR,
                        serverError
                    );
                case 404:
                    return createShakaError(
                        shaka.util.Error.Severity.CRITICAL,
                        shaka.util.Error.Category.NETWORK,
                        shaka.util.Error.Code.HTTP_ERROR,
                        serverError
                    );
                case 500:
                    return createShakaError(
                        shaka.util.Error.Severity.RECOVERABLE,
                        shaka.util.Error.Category.NETWORK,
                        shaka.util.Error.Code.HTTP_ERROR,
                        serverError
                    );
                default:
                    return createShakaError(
                        shaka.util.Error.Severity.RECOVERABLE,
                        shaka.util.Error.Category.NETWORK,
                        shaka.util.Error.Code.HTTP_ERROR,
                        serverError
                    );
            }
        }
        const prepareShakaResponse = async (response, uri) => {
            try {
                const data = await response.arrayBuffer();
                const responseHeaders = {};
                response.headers.forEach((value, key) => {
                    responseHeaders[key.toLowerCase()] = value;
                });
                return {
                    uri: response.url,
                    originalUri: uri,
                    data,
                    headers: responseHeaders,
                    timeMs: null,
                    fromCatch: response.fromCatch || false
                }
            }
            catch (error) {
                throw createShakaError(
                    shaka.util.Error.Severity.CRITICAL,
                    shaka.util.Error.Category.NETWORK,
                    shaka.util.Error.Code.RESPONSE_BUFFER_READ_ERROR,
                    null,
                    error
                );
            }
        }
        const refreshStreamToken = async (streamRefreshToken, retryCount = 0) => {
            try {
                const response = await fetch('http://localhost:8080/api/stream/refreshStreamToken', {
                    method: 'POST',
                    body: JSON.stringify({ streamRefreshToken }),
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.status >= 400) {
                    const errorData = await response.json();
                    if (response.status === 401 && errorData.code === streamingConstants.ACCESS_TOKEN_EXPIRED && retryCount <= streamingConstants.MAX_RETRIES) {
                        const { isRefTknInvalid, detail } = await refreshAccessToken();
                        if (isRefTknInvalid) {
                            throw handleHttpError(detail.response.status, detail.data);
                        }
                        return refreshStreamToken(streamRefreshToken, retryCount + 1);
                    }
                    throw handleHttpError(response.status, errorData);
                }
                return response.json();
            }
            catch (error) {
                if (error instanceof shaka.util.Error) {
                    throw error;
                }
                else if (error instanceof FetchWithAuthError) {
                    throw handleHttpError(500, error.errorObj);
                }
                else if (error.name === 'TypeError') {
                    throw createShakaError(
                        shaka.util.Error.Severity.RECOVERABLE,
                        shaka.util.Error.Category.NETWORK,
                        shaka.util.Error.Code.HTTP_ERROR,
                        null,
                        error
                    )
                }
                else {
                    throw createShakaError(
                        shaka.util.Error.Severity.CRITICAL,
                        shaka.util.Error.Category.NETWORK,
                        shaka.util.Error.Code.HTTP_ERROR,
                        null,
                        error
                    )
                }
            }
        }
        const fetchWithRetry = async (uri, options, retryCount = 0) => {
            try {
                const response = await fetch(uri, options);
                if (response.status >= 400) {
                    const errorData = await response.json();

                    if (response.status === 401 && errorData.code === streamingConstants.ACCESS_TOKEN_EXPIRED && retryCount <= streamingConstants.MAX_RETRIES) {
                        const { isRefTknInvalid, detail } = await refreshAccessToken();
                        if (isRefTknInvalid) {
                            throw handleHttpError(detail.response.status, detail.data);
                        }
                        return fetchWithRetry(uri, options, retryCount + 1);
                    }
                    if (response.status === 401 && errorData.code === streamingConstants.STREAM_TOKEN_EXPIRED && retryCount <= streamingConstants.MAX_RETRIES) {
                        const tokens = await refreshStreamToken(streamTokensRef.current.refreshToken);
                        streamTokensRef.current = {
                            accessToken: tokens.streamAccessToken,
                            refreshToken: tokens.streamRefreshToken
                        }
                        const newUri = new URL(uri);
                        newUri.searchParams.set('_token', tokens.streamAccessToken);
                        return fetchWithRetry(newUri, options, retryCount + 1);
                    }
                    throw handleHttpError(response.status, errorData);
                }
                return response;
            }
            catch (error) {
                if (error instanceof shaka.util.Error) {
                    throw error;
                }
                else if (error instanceof FetchWithAuthError) {
                    throw handleHttpError(500, error.errorObj);
                }
                else if (error.name === 'TypeError') {
                    throw createShakaError(
                        shaka.util.Error.Severity.RECOVERABLE,
                        shaka.util.Error.Category.NETWORK,
                        shaka.util.Error.Code.HTTP_ERROR,
                        null,
                        error
                    )
                }
                else {
                    throw createShakaError(
                        shaka.util.Error.Severity.CRITICAL,
                        shaka.util.Error.Category.NETWORK,
                        shaka.util.Error.Code.HTTP_ERROR,
                        null,
                        error
                    )
                }
            }
        }
        const schemePlugin = async (uri, request, reqType) => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const fetchOptions = {
                method: request.method || 'GET',
                headers: request.headers || {},
                body: request.body || null,
                credentials: request.allowCrossSiteCredentials ? 'include' : 'same-origin',
                cache: request.retryParameters && request.retryParameters.maxAttempts > 1
                    ? 'no-store'  // Disable cache if retries are enabled
                    : 'default',
                redirect: 'follow',
                signal: abortControllerRef.current.signal
            }
            try {
                if (reqType === shaka.net.NetworkingEngine.RequestType.MANIFEST) {
                    const response = await fetchWithRetry(uri, fetchOptions);

                    streamTokensRef.current = {
                        accessToken: response.headers.get('X-Stream-Access-Token'),
                        refreshToken: response.headers.get('X-Stream-Refresh-Token'),
                    }
                    return await prepareShakaResponse(response, uri);
                }
                else {
                    const response = await fetchWithRetry(uri, fetchOptions);
                    return await prepareShakaResponse(response, uri);
                }
            }
            catch (error) {
                if (error instanceof shaka.util.Error) {
                    throw error;
                }
                else if (error.name === 'TypeError') {
                    throw createShakaError(
                        shaka.util.Error.Severity.RECOVERABLE,
                        shaka.util.Error.Category.NETWORK,
                        shaka.util.Error.Code.HTTP_ERROR,
                        null,
                        error
                    )
                }
                else {
                    throw createShakaError(
                        shaka.util.Error.Severity.CRITICAL,
                        shaka.util.Error.Category.NETWORK,
                        shaka.util.Error.Code.HTTP_ERROR,
                        null,
                        error
                    )
                }
            }
        }
        const requestFilter = (reqType, request) => {
            if (reqType === shaka.net.NetworkingEngine.RequestType.MANIFEST) {
                request.allowCrossSiteCredentials = true;
            }
            else {
                request.streamRefreshToken = streamTokensRef.current.refreshToken;
                request.uris = request.uris.map(uri => {
                    const url = new URL(uri);
                    url.searchParams.append('_token', streamTokensRef.current.accessToken);
                    return url;
                });
            }
        }
        const initializeAudioPlayer = async () => {
            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                    gainNodeRef.current = audioContextRef.current.createGain();
                    gainNodeRef.current.connect(audioContextRef.current.destination);

                    const audio = new Audio();
                    audioElementRef.current = audio;
                    audio.addEventListener('loadedmetadata', onLoadedMetadata);
                    audio.addEventListener('error', (error) => {
                        console.log(error)
                    })

                    const isShakaSupportedInBrowser = shaka.Player.isBrowserSupported();
                    setShakaSupported(isShakaSupportedInBrowser);
                    if (isShakaSupportedInBrowser) {
                        shaka.net.NetworkingEngine.registerScheme('http', schemePlugin);
                        shaka.net.NetworkingEngine.registerScheme('https', schemePlugin);

                        shakaPlayerRef.current = new shaka.Player();
                        await shakaPlayerRef.current.attach(audio);
                        shakaPlayerRef.current.configure(playerConfRef.current);

                        shakaPlayerRef.current.addEventListener('error', onErrorEvent);
                        shakaPlayerRef.current.addEventListener('buffering', handleBuffering);

                        shakaPlayerRef.current.getNetworkingEngine().registerRequestFilter(requestFilter);
                    }
                    else {
                        setPlayerNotSuppotedWarnPopUpHidden(false);
                    }

                    audioSorceRef.current = audioContextRef.current.createMediaElementSource(audio);
                    audioSorceRef.current.connect(gainNodeRef.current);

                    //getting audioSettings from localstorage
                    const savedAudioSettings = localStorage.getItem('audioSettings');
                    if (savedAudioSettings) {
                        setAudioSettings(JSON.parse(savedAudioSettings));
                    }
                }
            }
            catch (error) {
                console.log(error);
            }
        }
        initializeAudioPlayer();
        return () => {
            if (audioContextRef.current) {
                console.log('audioContextRef')

                audioContextRef.current.close();
            }
            if (shakaPlayerRef.current) {
                console.log('shakaPlayerRef')

                shakaPlayerRef.current.destroy();
                shakaPlayerRef.current.removeEventListener('error', onErrorEvent);
                shakaPlayerRef.current.removeEventListener('buffering', handleBuffering);
            }
            if (audioElementRef.current) {
                console.log('audioElementRef')
                audioElementRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
            }
        };
    }, []);                                 // to initaliza shakplayer and audioElement and event handling
    useEffect(() => {
        if (!shakaPlayerRef.current) return;
        const onLoadedManifest = async () => {
            try {
                if ((audioSettings.autoplay && (isAutoNavigated || isUserInteractedWithTrack)) || isUserInteractedWithTrack || isPlaying) {
                    await audioElementRef.current.play();
                    setPlaying(true);
                    setUserInteractedWithTrack(false);
                    setAutoNavigated(false);
                }
                setAudioLoaded(true);
            }
            catch (error) {
                console.log('Error in loaded event.', error)
            }
        }
        shakaPlayerRef.current.addEventListener('loaded', onLoadedManifest);

        return () => {
            shakaPlayerRef.current.removeEventListener('loaded', onLoadedManifest);
        }
    }, [audioSettings, isPlaying, isUserInteractedWithTrack, isAutoNavigated]);  // to play track while reloading or navigating or interacting
    useEffect(() => {
        const audio = audioElementRef.current;
        if (audio) {
            const onEnded = async () => {
                console.warn('--- Ended event occured ---');
                try {
                    if (audioSettings.loopType === 1) {

                        // First pause to ensure clean state
                        audio.currentTime = 0;
                        setAudioSeekbarValue(0);
                        setCurrentTime('00:00');

                        // Check if audio context needs resuming
                        if (audioContextRef.current?.state === 'suspended') {
                            await audioContextRef.current.resume();
                        }
                        if (isPlaying) await audio.play();
                    }
                    else {
                        navigateTo(1, false, true);
                    }
                } catch (error) {
                    console.log("Error at Ended event.", error.name);
                }
            }
            audio.addEventListener('ended', onEnded);
            return () => {
                audio.removeEventListener('ended', onEnded);
            }
        }
    }, [navigateTo, audioSettings, isPlaying]);  // to attach event when track end - ended event
    useEffect(() => {
        const audio = audioElementRef.current;
        if (audio) {
            const onTimeUpdate = () => {
                if (audio.duration && !isSeeking) {
                    const seekValue = (audio.currentTime * 100) / audio.duration;
                    setCurrentTime(formatTime(audio.currentTime));
                    setAudioSeekbarValue(seekValue);
                }
            }

            audio.addEventListener('timeupdate', onTimeUpdate);

            return () => {
                audio.removeEventListener('timeupdate', onTimeUpdate);
            }
        }
    }, [isSeeking]);                        // to play song when seek Ends
    useEffect(() => {
        const normalizeValue = soundLevel / 100;
        let scaledValue;
        if (normalizeValue < .5) {
            scaledValue = Math.pow(normalizeValue, 2);
        } else {
            scaledValue = .5 + (normalizeValue - .5) * 2;
        }
        scaledValue = Math.min(scaledValue, 1);
        gainNodeRef.current.gain.value = scaledValue;
    }, [soundLevel]);                       // to change sound volume in optimal way 
    useEffect(() => {
        if (isAlbumEditOverlayHidden) {
            setGenres([]);
            setLanguages([]);
        }
        else {
            getGenresAndLanguages();
        }
    }, [isAlbumEditOverlayHidden]);         // get genres and languages
    useEffect(() => {
        if (!trackForEdit) return;
        if (featuredArtists.length === trackForEdit.featuredArtists.length) {
            if (featuredArtists.every(ele => trackForEdit.featuredArtists.includes(ele))) {
                setUpdatedTrackData(removeKeyFromObj(updatedTrackData, 'featuredArtists'));
                return;
            }
        }
        setUpdatedTrackData(prev => {
            return {
                ...prev,
                featuredArtists
            }
        })
    }, [featuredArtists, trackForEdit]);    // to check if newftartist array is differ from old 
    useEffect(() => {
        if (editTrackAudioSrc) {
            const audio = new Audio();
            editTrackAudioElementRef.current = audio;
            audio.src = editTrackAudioSrc;
            audio.load();

            // listeners
            const onLoadedMetadata = () => {
                setUpdatedTrackData(prev => {
                    return {
                        ...prev,
                        duration: audio.duration
                    }
                })
                setEditTrackPlaybackStates(prev => {
                    return {
                        ...prev,
                        duration: formatTime(audio.duration),
                        curTime: '00:00',
                        seekVal: 0,
                        isPlaying: false
                    }
                })
            }
            const onTimeUpdate = () => {
                if (!audio.duration) return;
                setEditTrackPlaybackStates(prev => {
                    return {
                        ...prev,
                        seekVal: (audio.currentTime * 100) / audio.duration,
                        curTime: formatTime(audio.currentTime)
                    }
                })
            }
            const onEnded = () => {
                setEditTrackPlaybackStates(prev => {
                    return {
                        ...prev,
                        curTime: '00:00',
                        seekVal: 0,
                        isPlaying: false
                    }
                })
            }

            //events
            audio.addEventListener('loadedmetadata', onLoadedMetadata);
            audio.addEventListener('timeupdate', onTimeUpdate);
            audio.addEventListener('ended', onEnded);

            return () => {
                //events
                audio.removeEventListener('loadedmetadata', onLoadedMetadata);
                audio.removeEventListener('timeupdate', onTimeUpdate);
                audio.removeEventListener('ended', onEnded);

                audio.pause();
                editTrackAudioElementRef.current = null;
                URL.revokeObjectURL(editTrackAudioSrc);
            }
        }

    }, [editTrackAudioSrc]);                // to handle playback when use select audio for edit 
    useEffect(() => {
        if (selectedTrack) {
            if ('mediaSession' in navigator) {
                const album = selectedAlbum.title;
                const artist = selectedAlbum.artist.name;
                const title = selectedTrack.name;
                const src = `http://localhost:8080/api/media/image/tracks/small/${selectedTrack.cover.name}`;

                navigator.mediaSession.metadata = new MediaMetadata({
                    album, artist, title,
                    artwork: [{ src }]
                });
                navigator.mediaSession.setActionHandler('play', togglePlayPause);
                navigator.mediaSession.setActionHandler('pause', togglePlayPause);

                return () => {
                    navigator.mediaSession.setActionHandler('play', null);
                    navigator.mediaSession.setActionHandler('pause', null);
                };
            }
        }
    }, [selectedTrack, selectedAlbum, togglePlayPause]);      // to handle navigator for selectedTrack
    useEffect(() => {
        if (selectedAlbum && trackForEdit) {
            if ('mediaSession' in navigator) {
                const album = selectedAlbum.title;
                const artist = selectedAlbum.artist.name;
                const title = trackForEdit.name;
                const src = `http://localhost:8080/api/media/image/tracks/small/${trackForEdit.trackImage}`;

                navigator.mediaSession.metadata = new MediaMetadata({
                    album, artist, title,
                    artwork: [{ src }]
                });
                navigator.mediaSession.setActionHandler('play', onPlayPauseBtnClick);
                navigator.mediaSession.setActionHandler('pause', onPlayPauseBtnClick);

                return () => {
                    navigator.mediaSession.setActionHandler('play', null);
                    navigator.mediaSession.setActionHandler('pause', null);
                };
            }
        }
    }, [trackForEdit, selectedAlbum, onPlayPauseBtnClick]);   // to handle navigator for trackForEdit
    useEffect(() => {
        if (selectedAlbum && !selectedTrack) {
            setExtractedColor({
                primarySidebarBc: selectedAlbum.palette.DarkVibrant,
                secondarySidebarBc: selectedAlbum.palette.LightVibrant,
                selectedTrackBc: selectedAlbum.palette.Vibrant
            })
        }
    }, [selectedAlbum, selectedTrack]);     // to reset color pallete back to album when no track selected(selectedTrack)
    useEffect(() => {
        if (selectedTrack || updatedTrackData) {
            const onKeyDown = (e) => {
                const activeElement = document.activeElement;
                const isInputActive = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

                if (e.code === 'Space' && !isInputActive) {
                    e.preventDefault();
                    if (selectedTrack) {
                        togglePlayPause();
                    }
                    else if (updatedTrackData.trackFile) {
                        onPlayPauseBtnClick();
                    }
                }
            }
            document.addEventListener('keydown', onKeyDown);
            return () => {
                document.removeEventListener('keydown', onKeyDown);
            }
        }
    }, [selectedTrack, togglePlayPause, updatedTrackData, onPlayPauseBtnClick]);  // to playpause playback on space press


    // -------------------------Use Context -----------------------------------------------
    const contextValue = {
        // for socket message from server
        socketMessage,

        //setters
        setSelectModeEnableForDeleteTrack, setTracksForDelete, infoPopupForTrackDeletionConfig,

        setAlbums, selectedTrackImgUrl, setTrackListHidden, setTrackForEdit, setLanguageListHidden, setDiscardPopupHidden, setDiscardPopupConfig,
        setGenreListHidden, setAlbumEditOverlayHidden, setUpdatedALbumData,

        setAudioConflictPopUpHidden, setMobileAlbumSidebarSkeletonLoading, setInitSrcError, setSidebarExpanded, setPlaybarExp, setMobileSidebarExp, setSelectedTrack, setExtractedColor, setSelectedAlbum, setTokenInfo,


        //states
        albums, isAlbumProcessing, isDeleteAlbumConfirmationPopupHidden, deleteAlbumConfirmationPopupConfig,

        isSelectModeEnableForDeleteTrack, tracksForDelete, isDeleteTrackConfirmationPopupHidden, deleteTrackConfirmationPopupConfig,

        discardPopupConfig, isDiscardPopupHidden, languages, isTrackListHidden, trackForEdit, updatedTrackData, isLanguageListHidden, editTrackPlaybackStates, featuredArtists, isRestoreDefaultPopupHidden, isListLoaded,

        isEditAlbumInfoDialogHidden, isGenreListHidden, genres, isAlbumEditOverlayHidden, updatedAlbumData, selectedAlbumImgUrl,
        isAudioConflictPopUpHidden, isAudioLoaded, soundLevel, audioSettings, isMobileAlbumSidebarSkeletonLoading, isSidebarExpanded, isPlaybarExp, selectedTrack, extractedColor, selectedAlbum, audioContextRef, initSrcError, isPlaying, currentTime, audioDuration, audioSeekbarValue,


        //method for delete album and track
        toggleSelectModeForDeleteTrack, onTrackClickForDelete, toggleSelectAllTracksForDelete, onDeleteTrackBtnClick, onDeleteAlbumBtnClick,

        //method from edit overlay
        onUpdateTrack, onUpdateAlbum, resetAlbumAndTrackChanges, closeEditAlbum, backToEditAlbum, onSelectTrackChange, onTrackClickForEdit, onTrackImgChange, onResetTrackImageBtnClick, onTrackTitleChange, onTrackTitleBlur, onTrackLanguageChange, findNameById, onTrackAudioChange, onPlayPauseBtnClick, onEditTrackAudioSeek, onResetTrackAudioBtnClick, onFeaturedArtistKeyDown, removeFeaturedArtist, addFeaturedArtist, restoreSomeUpdatedTrack, hideRestoreDefaultPopup, showRestoreDefaultPopup,

        onEditAlbumInfoBtnClick, onEditAlbumOverlayClick, onAlbumTitleBlur, onAlbumTitleChange, onAlbumImgEditBtnClick, restoreDefaultUpdatedAlbum, onResetAlbumImgBtnClick, onAlbumImgChange, onGenreChange, manupulateUpdatedAlbumData,

        //general method
        resetPlayer, handleSoundMute, handleSoundlevel, handleTrackClick, closeALbumSidebar, onSeeking, onSeekEnd, navigateTo, togglePlayPause, changeAudioSetting,
    };

    return (
        <MasterLayoutContextProvider value={contextValue}>
            <div className={style.AdminPanel}>
                <div className={style.Sidebar}>

                    {/* -------------------------------------------------  logo */}
                    <div className={style.Logo}>
                        <img src={logo} />
                        <span>Sangeet</span>
                    </div>

                    {/* -------------------------------------------------  navLinks */}
                    <div className={style.NavLinksWrapper}>
                        <NavLink title='Home' className={({ isActive }) => isActive ? `${style.SidebarIcon} ${style.Active}` : style.SidebarIcon} to='/admin-panel' end>
                            <BiHomeAlt2 />
                        </NavLink>
                        <NavLink title='Create track' className={({ isActive }) => isActive ? `${style.SidebarIcon} ${style.Active}` : style.SidebarIcon} to='/admin-panel/create-track'>
                            <GoIssueTracks />
                        </NavLink>
                        <NavLink title='Albums' className={({ isActive }) => isActive ? `${style.SidebarIcon} ${style.Active}` : style.SidebarIcon} to='/admin-panel/albums'>
                            <IoAlbumsOutline />
                        </NavLink>
                        <NavLink title='Processing overview' className={({ isActive }) => isActive ? `${style.SidebarIcon} ${style.ProcessOverview} ${style.Active}` : `${style.SidebarIcon} ${style.ProcessOverview}`} to='/admin-panel/processing-overview'>
                            <BsHddRack />
                        </NavLink>
                    </div>

                    {/* -------------------------------------------------  overlay navbar for mobile & tablets */}
                    {
                        selectedAlbum &&
                        <div
                            className={`${style.NavbarOverlay} ${isPlaybarExp ? style.ExpOverlay : ''}`}
                            style={{ '--primarySidebarBc': extractedColor.primarySidebarBc }}
                        >
                            {/* -------------------------------------------------  overlay left nev */}
                            <div className={style.OverlayAlbumOrTrack} onClick={() => { setMobileSidebarExp(true) }}>
                                {
                                    selectedTrack ?
                                        <>
                                            <div className={style.TrackImg}>
                                                <img className={!isPlaying ? style.PauseRotation : ''} src={`http://localhost:8080/api/media/image/tracks/small/${selectedTrack?.cover.name}`} />
                                            </div>
                                            {/* ------------------------------------------------- playbar expander */}
                                            {
                                                !isPlaybarExp &&
                                                <div
                                                    className={`${style.PlaybarExpander}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPlaybarExp(true)
                                                    }}
                                                >
                                                    <RiArrowLeftWideFill />
                                                </div>
                                            }
                                        </>
                                        :
                                        <div className={style.AlbumImg}>
                                            <img src={`http://localhost:8080/api/media/image/albums/medium/${selectedAlbum?.cover.name}`} />
                                        </div>
                                }
                            </div>
                            {/* -------------------------------------------------  overlay right nev */}
                            {
                                selectedTrack &&
                                <div className={style.OverlayPlaybar}>
                                    {/* -------------------------------------------------  left playbar side */}
                                    <div className={style.PlaybarLeft}>
                                        <p ref={playbarTitleRef} className={isPlaybarTitleOverflow ? style.SeamlessSlider : ''}>
                                            <span>{selectedTrack?.formattedTitle}</span>
                                            <span>{isPlaybarTitleOverflow && selectedTrack?.formattedTitle}</span>
                                        </p>
                                        <span>{selectedAlbum?.artist?.name}</span>
                                    </div>
                                    {/* -------------------------------------------------  right playbar side */}
                                    <div className={style.PlaybarCenter}>
                                        <div className={style.SeekbarContainer}>
                                            <span>{currentTime}</span>
                                            <InputRange
                                                onChange={onSeeking}
                                                onChangeComplete={onSeekEnd}
                                                value={audioSeekbarValue}
                                            />
                                            <span>{audioDuration}</span>
                                        </div>
                                        <div className={style.InterationContainer}>
                                            <span
                                                className={style.SideBtn}
                                                onClick={() => navigateTo(-1, true)}
                                            ><MdSkipPrevious /></span>

                                            {isAudioLoaded ?
                                                <span
                                                    className={`${style.PlayPauseBtn}`}
                                                    onClick={togglePlayPause}
                                                >{isPlaying ? <IoPause /> : <IoPlay />}</span>
                                                :
                                                <span className={`${style.PlayPauseBtn} ${style.Disabled}`}>{isPlaying ? <IoPause /> : <IoPlay />}</span>
                                            }

                                            <span
                                                className={style.SideBtn}
                                                onClick={() => navigateTo(1, true)}
                                            ><MdSkipNext /></span>
                                        </div>
                                    </div>
                                    {/* -------------------------------------------------  playbar collapser */}
                                    <div className={`${style.PlaybarCollapser}`} onClick={() => setPlaybarExp(false)}><RiArrowLeftWideFill /></div>
                                </div>
                            }
                        </div>
                    }
                    {/* ------------------------------------------------- undraggable seekbar for mobile */}
                    {selectedTrack && <div className={style.UndraggableSeekbar}><span style={{ width: `${audioSeekbarValue}%` }}></span></div>}
                </div>

                {/* ------------------------------------------------- Page container */}

                <div className={style.PageContainerWrapper}>

                    <div className={style.PageContainer}>
                        <Outlet />
                    </div>

                    {
                        '/admin-panel/albums' !== location.pathname && isAlbumProcessing &&

                        <div className={style.BottomInfoBannerWrapper}>
                            <div className={style.BottomInfoBanner}>
                                <SpinnerLoader2 />
                                <span>Your album is updating—navigate freely!</span>
                            </div>
                        </div>
                    }

                    {
                        !hideMasterLayoutPlaybarRoute.includes(location.pathname) && selectedTrack &&
                        <div className={style.MasterLayoutPlaybarWrapper}>
                            <div className={style.MasterLayoutPlaybar}>
                                <div className={style.MLPLeft}>
                                    <div className={style.MLPTrackImg}>
                                        <img src={`http://localhost:8080/api/media/image/tracks/small/${selectedTrack?.cover.name}`} alt="" />
                                    </div>
                                    <div className={style.MLPTrackInfo}>
                                        <span className={style.MLPTrackTitle}>{selectedTrack?.name}</span>
                                        <span className={style.MLPAlbumTitle}>{selectedAlbum?.title}</span>
                                    </div>
                                </div>

                                <div className={style.MLPCenter}>
                                    <div className={style.MLPInteractionBtns}>

                                        <span
                                            style={{ color: `${audioSettings.loopType === 1 ? 'var(--light-green)' : 'var(--white-smoke)'}` }}
                                            title={`${audioSettings.loopType === 1 ? 'Single Loop' : 'Album Loop'}`}
                                            onClick={() => changeAudioSetting('loopType')}
                                        >{audioSettings.loopType === 1 ? <TbRepeatOnce /> : <TbRepeat />}</span>

                                        <span
                                            className={style.MLPSideBtns}
                                            onClick={() => navigateTo(-1, true)}
                                        ><MdSkipPrevious /></span>

                                        {isAudioLoaded ?
                                            <span
                                                className={style.MLPPlayPauseBtn}
                                                onClick={togglePlayPause}
                                            >{isPlaying ? <IoPause /> : <IoPlay />}</span>
                                            :
                                            <span
                                                className={`${style.MLPPlayPauseBtn} ${style.Disabled}`}
                                            >{isPlaying ? <IoPause /> : <IoPlay />}</span>
                                        }

                                        <span
                                            className={style.MLPSideBtns}
                                            onClick={() => navigateTo(1, true)}
                                        ><MdSkipNext /></span>

                                        <span
                                            style={{ color: `${audioSettings.autoplay ? 'var(--light-green)' : 'var(--white-smoke)'} ` }}
                                            title={`${audioSettings.autoplay ? 'Autoplay On' : 'Autoplay Off'}`}
                                            onClick={() => changeAudioSetting('autoplay')}
                                        ><IoInfinite /></span>

                                    </div>
                                    <div className={style.MLPSeekBar}>
                                        <span>{currentTime}</span>
                                        <InputRange
                                            value={audioSeekbarValue}
                                            onChange={onSeeking}
                                            onChangeComplete={onSeekEnd}
                                            handleStyle={{
                                                height: '10px',
                                                width: '10px',
                                                marginTop: '-3.5px'
                                            }}
                                        />
                                        <span>{audioDuration}</span>
                                    </div>
                                </div>

                                <div className={style.MLPRight}>
                                    <span onClick={handleSoundMute}>{soundLevel <= 0 ? <HiSpeakerXMark /> : <HiSpeakerWave />}</span>
                                    <InputRange
                                        value={soundLevel}
                                        onChange={handleSoundlevel}
                                        handleStyle={{
                                            height: '10px',
                                            width: '10px',
                                            marginTop: '-3.5px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    }

                </div>

                {/* ------------------------------------------------------------------ bottom side - album sidebar for mobile & tablets */}
                <div
                    className={`${style.MobileAlbumSidebar} ${isMobileSidebarExp ? style.MobileSidebarExp : style.MobileSidebarColl}`}
                    style={{
                        '--primarySidebarBc': extractedColor.primarySidebarBc,
                        '--secondarySidebarBc': extractedColor.secondarySidebarBc,
                        '--selectedTrackBc': extractedColor.selectedTrackBc
                    }}
                >

                    {/* ------------------------------------------------------------------ Mobile sidebar header  */}
                    {
                        selectedAlbum &&
                        <>

                            <div className={style.HeaderWrapper}>
                                <img
                                    src={
                                        selectedTrack ? `http://localhost:8080/api/media/image/tracks/medium/${selectedTrack?.cover.name}`
                                            : `http://localhost:8080/api/media/image/albums/medium/${selectedAlbum?.cover.name}`
                                    }
                                    alt=""
                                />
                                <div className={style.Header} >
                                    <div className={style.TopArea}>
                                        <span onClick={() => setMobileSidebarExp(false)}><IoIosArrowDown /></span>
                                        <div className={style.HeadingText}>
                                            {
                                                selectedTrack &&
                                                <>
                                                    <h2>Currently playing</h2>
                                                    <p>{selectedTrack?.name}</p>
                                                </>
                                            }
                                        </div>
                                        <span onClick={closeALbumSidebar}><IoClose /></span>
                                    </div>
                                    <div className={style.BottomArea}>
                                        <div className={style.ImgContainer}>
                                            <img src={`http://localhost:8080/api/media/image/albums/medium/${selectedAlbum?.cover.name}`} alt="" />
                                        </div>
                                        <div className={style.AlbumDataContainer}>
                                            <div className={style.AlbumMeta}>
                                                <h2>{selectedAlbum?.title}</h2>
                                                <p>
                                                    <span>{selectedAlbum?.genre?.name}</span>
                                                    <span className={style.CreatedAt}>{selectedAlbum?.createdAt}</span>
                                                </p>
                                            </div>
                                            <div className={style.AlbumMetrics}>
                                                <div className={style.Metric}>
                                                    <span>450K</span>
                                                    <p>visit</p>
                                                </div>
                                                <div className={style.Metric}>
                                                    <span>450K</span>
                                                    <p>likes</p>
                                                </div>
                                                <div className={style.Metric}>
                                                    <span>{selectedAlbum?.track?.length}</span>
                                                    <p>tracks</p>
                                                </div>
                                                <div className={style.Metric}>
                                                    <span>{formatTime(selectedAlbum?.albumDuration)}</span>
                                                    <p>duration</p>
                                                </div>
                                            </div>
                                            <div className={style.EditALbumBtn}>
                                                <button
                                                    onClick={() => setAlbumEditOverlayHidden(false)}
                                                >
                                                    Edit
                                                    <BiSolidEdit />
                                                </button>
                                                <span></span>
                                                <button
                                                    onClick={onDeleteAlbumBtnClick}
                                                >
                                                    Delete
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Delete Confirmation popup for album */}
                            <DeleteConfirmationPopup
                                wrapperStyle={{ padding: '10px' }}
                                popupStyle={{
                                    maxWidth: '450px',
                                    padding: '15px'
                                }}

                                title={'Delete Album?'}
                                message={`Are you sure you want to delete "${selectedAlbum.title}"? This action cannot be undone(Associated tracks will also be deleted).`}
                                confirmationString={`${selectedAlbum.title}`}

                                onCancel={deleteAlbumConfirmationPopupConfig.onCancel}
                                onDelete={deleteAlbumConfirmationPopupConfig.onDelete}
                                isHidden={isDeleteAlbumConfirmationPopupHidden}
                            />

                        </>
                    }

                    {/* ------------------------------------------------------------------ Mobile sidebar Body  */}
                    {
                        selectedAlbum &&
                        <div className={style.Body}>
                            {
                                selectedAlbum?.track?.length > 0 ?
                                    <>
                                        <div className={style.BodyHead}>
                                            <h2>Songs</h2>
                                            <div className={style.AudioSettingContainer}>
                                                <span>{audioSettings.autoplay ? 'Autoplay On' : 'Autoplay Off'}</span>
                                                <span>|</span>
                                                <span>{audioSettings.loopType === 1 ? 'Single Loop' : 'Album Loop'}</span>
                                            </div>
                                        </div>

                                        <div className={style.TrackContainer}>
                                            {
                                                selectedAlbum?.track?.map((track, index) => {
                                                    return (
                                                        <div
                                                            className={`${style.Track}`}
                                                            key={index}
                                                            onClick={() => handleTrackClick(track, true)}
                                                        >
                                                            <span className={style.TrackIndex}>
                                                                {
                                                                    selectedTrack?._id !== track._id ?
                                                                        index + 1 :
                                                                        !isAudioLoaded ?
                                                                            <SpinnerLoader /> :
                                                                            <FaPlay />
                                                                }
                                                            </span>
                                                            <div className={style.Img}>
                                                                <img src={`http://localhost:8080/api/media/image/tracks/small/${track?.cover.name}`} />
                                                            </div>
                                                            <p className={`${style.TrackTitle} ${selectedTrack?._id === track._id ? style.SelectedTrackTitle : ''}`}>{track?.name}</p>
                                                            <div className={style.TrackMeta}>
                                                                <span><AiOutlineLike />52k</span>
                                                                <span><FaHeadphones />500k</span>
                                                                <span><IoTimerSharp />{track?.formattedDuration}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>
                                    </>
                                    :
                                    <h3>Look like your album is empty.</h3>
                            }

                            <div className={`${style.SoundControlOverlay} ${!isSoundControlOverlayHidden ? style.ShowSoundControlOverlay : ''}`}>
                                <span>{soundLevel <= 0 ? <HiSpeakerXMark onClick={handleSoundMute} /> : <HiSpeakerWave onClick={handleSoundMute} />}</span>
                                <InputRange
                                    value={soundLevel}
                                    onChange={handleSoundlevel}
                                    onChangeComplete={fadeOutSoundControlOverlay}
                                />
                                <span>{soundLevel}</span>
                            </div>
                        </div>
                    }

                    {/* ------------------------------------------------------------------ Mobile sidebar footer  */}
                    {
                        selectedAlbum &&
                        <div className={`${style.FooterWrapper} ${selectedTrack && isAudioLoaded ? style.ShowFooterWrapper : ''}`}>
                            <img
                                src={
                                    selectedTrack ? `http://localhost:8080/api/media/image/tracks/medium/${selectedTrack?.cover.name}`
                                        : `http://localhost:8080/api/media/image/albums/medium/${selectedAlbum?.cover.name}`
                                }
                                alt=""
                            />
                            <div className={style.Extra}></div>
                            <div className={style.Footer}>
                                <div className={style.FtInteractionBtns}>

                                    <span className={`${audioSettings.loopType === 1 ? style.ActiveSetting : ''}`}
                                        onClick={() => changeAudioSetting('loopType')}
                                    >{audioSettings.loopType === 1 ? <TbRepeatOnce /> : <TbRepeat />}</span>

                                    <span
                                        className={style.FtSideBtns}
                                        onClick={() => navigateTo(-1, true)}
                                    ><MdSkipPrevious /></span>

                                    <span
                                        className={style.FtPlayPauseBtn}
                                        onClick={togglePlayPause}
                                        style={{ paddingLeft: `${isPlaying ? 'unset' : '2px'}` }}
                                    >{!isPlaying ? <IoPlay /> : <IoPause />}</span>

                                    <span
                                        className={style.FtSideBtns}
                                        onClick={() => navigateTo(1, true)}
                                    ><MdSkipNext /></span>

                                    <span className={audioSettings.autoplay ? style.ActiveSetting : ''}
                                        onClick={() => changeAudioSetting('autoplay')}
                                    ><IoInfinite /></span>

                                    <span onClick={handleSoundControlOverlayShow}><TbDeviceSpeaker /></span>

                                </div>
                                <div className={style.FtSeekbarContainer}>
                                    <span>{currentTime}</span>
                                    <InputRange
                                        value={audioSeekbarValue}
                                        onChange={onSeeking}
                                        onChangeComplete={onSeekEnd}
                                        trackStyle={{
                                            backgroundColor: `${extractedColor.secondarySidebarBc}`
                                        }}
                                        handleStyle={{
                                            height: '12px',
                                            width: '12px',
                                            marginTop: '-4px',
                                        }}
                                    />
                                    <span>{audioDuration}</span>
                                </div>
                            </div>
                        </div>
                    }


                    {/* ------------------------------------------------------------------ Mobile album edit overlay ( album )  */}
                    {
                        selectedAlbum &&
                        <>

                            <div
                                className={`${style.MobileEditAlbumOverlay} ${!isAlbumEditOverlayHidden ? style.ShowOverlayOpacity : ''}`}
                                onClick={onEditAlbumOverlayClick}
                            >
                                <div className={style.EditAlbumTopBtns}>
                                    <span
                                        onClick={onEditAlbumInfoBtnClick}
                                    ><IoInformationCircleOutline /></span>

                                    <div
                                        className={style.EditAlbumInfoDialog}
                                        style={{ opacity: `${isEditAlbumInfoDialogHidden ? 0 : 1}` }}
                                    >Want to update your album details? Just click on any field you wish to edit and make your changes.</div>

                                    <span
                                        onClick={closeEditAlbum}
                                    ><IoClose /></span>
                                </div>

                                <div className={style.EditAlbumHeader}>
                                    <div className={style.EditAlbumImgWrapper}>
                                        <span
                                            style={{ display: `${updatedAlbumData.albumImage ? 'flex' : 'none'}` }}
                                            onClick={onResetAlbumImgBtnClick}
                                        ><LuImageMinus /></span>
                                        <img
                                            src={selectedAlbumImgUrl ? selectedAlbumImgUrl : `http://localhost:8080/api/media/image/albums/medium/${selectedAlbum.cover.name}`}
                                            alt="album image" />
                                        <input
                                            type="file"
                                            hidden
                                            ref={albumImageInputRef}
                                            onChange={onAlbumImgChange}
                                        />
                                        <span
                                            onClick={() => onAlbumImgEditBtnClick(albumImageInputRef)}
                                        ><TbPhotoEdit /></span>
                                    </div>

                                    <div className={style.EditAlbumContentWrapper}>

                                        <div className={style.EditAlbumTitle}>
                                            <label>Album name</label>
                                            <input
                                                type="text"
                                                value={'title' in updatedAlbumData ? updatedAlbumData.title : selectedAlbum.title}
                                                onChange={onAlbumTitleChange}
                                                onBlur={onAlbumTitleBlur}
                                            />
                                        </div>

                                        <div className={style.EditAlbumGenre}>
                                            <label>Genre</label>
                                            <button
                                                onClick={() => setGenreListHidden(false)}
                                            >
                                                <span>{findNameById(genres, updatedAlbumData.genre) || selectedAlbum?.genre?.name}</span>
                                                <MdMenuOpen />
                                            </button>

                                            {
                                                !isGenreListHidden &&
                                                <ListOverlay
                                                    itemList={genres}
                                                    selectedItem={updatedAlbumData.genre || selectedAlbum.genre._id}
                                                    onSelectChange={onGenreChange}
                                                    setHidden={setGenreListHidden}
                                                    isListLoaded={isListLoaded}
                                                />
                                            }

                                        </div>

                                        <div className={style.EditAlbumActionBtn}>
                                            <button
                                                onClick={restoreDefaultUpdatedAlbum}
                                            >Restore default</button>
                                            <button
                                                onClick={onUpdateAlbum}
                                            >Update</button>
                                        </div>

                                    </div>
                                </div>

                                <div className={style.EditAlbumBody}>
                                    {
                                        selectedAlbum?.track?.length > 0 ?
                                            <>
                                                <div className={style.EditAlbumTopArea}>
                                                    <h2>Songs</h2>
                                                    {
                                                        isSelectModeEnableForDeleteTrack ?
                                                            <button
                                                                onClick={toggleSelectAllTracksForDelete}
                                                            >{tracksForDelete.length > 0 ? 'Unselect all' : 'Select all'}</button>
                                                            :
                                                            <button
                                                                onClick={toggleSelectModeForDeleteTrack}
                                                            ><TbListCheck /></button>
                                                    }
                                                </div>
                                                <div
                                                    className={style.TrackContainer}
                                                >
                                                    {
                                                        selectedAlbum.track.map((track, index) => {
                                                            return (
                                                                <div
                                                                    className={`${style.Track}`}
                                                                    key={index}
                                                                    onClick={() => isSelectModeEnableForDeleteTrack ? onTrackClickForDelete(track) : onTrackClickForEdit(track)}
                                                                >
                                                                    {
                                                                        isSelectModeEnableForDeleteTrack ?
                                                                            <div className={style.DeleteTrackCheckbox}>
                                                                                <Checkbox
                                                                                    value={tracksForDelete.includes(track._id)}
                                                                                    boxStyle={{
                                                                                        height: '15px',
                                                                                        width: '15px',
                                                                                        borderColor: 'var(--white-smoke)'
                                                                                    }}
                                                                                    iconStyle={{
                                                                                        color: 'var(--obsidian-black)'
                                                                                    }}
                                                                                    selectedStyle={{
                                                                                        box: {
                                                                                            backgroundColor: 'var(--white-smoke)',
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            :
                                                                            <span className={style.TrackIndex}>{index + 1}</span>
                                                                    }
                                                                    <div className={style.Img}>
                                                                        <img src={`http://localhost:8080/api/media/image/tracks/small/${track?.cover.name}`} />
                                                                    </div>
                                                                    <p className={`${style.TrackTitle}`}>{track?.name}</p>
                                                                    <div className={style.TrackMeta}>
                                                                        <span><AiOutlineLike />52k</span>
                                                                        <span><FaHeadphones />500k</span>
                                                                        <span><IoTimerSharp />{track?.formattedDuration}</span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })
                                                    }
                                                </div>
                                                {
                                                    isSelectModeEnableForDeleteTrack &&
                                                    <div className={style.EditAlbumBottomArea}>
                                                        <span>
                                                            <BsCheckAll />
                                                            {tracksForDelete.length} selected
                                                        </span>
                                                        <div className={style.DeleteNCancelTrackBtnsWrapper}>

                                                            <button
                                                                onClick={toggleSelectModeForDeleteTrack}
                                                            >Cancel</button>

                                                            {
                                                                tracksForDelete.length > 0 ?
                                                                    <button
                                                                        onClick={onDeleteTrackBtnClick}
                                                                    >Delete</button>
                                                                    :
                                                                    <button
                                                                        style={{
                                                                            backgroundColor: '#c97070',
                                                                            cursor: 'default',
                                                                        }}
                                                                    >Delete</button>
                                                            }

                                                        </div>
                                                    </div>
                                                }
                                            </>
                                            :
                                            <h3>Look like your album is empty.</h3>
                                    }
                                </div>

                                {/* ------------------------------------------------------------------ Mobile track edit overlay ( track ) */}
                                <div className={`${style.MobileEditTrackOverlay} ${trackForEdit ? style.ShowOverlayOpacity : ''}`}>
                                    <div
                                        className={style.BackToEditAlbumBtn}
                                        onClick={backToEditAlbum}
                                    >
                                        <span>
                                            <IoMdArrowRoundBack />
                                        </span>
                                    </div>

                                    {
                                        trackForEdit &&
                                        <div className={style.EditTrackContainer}>
                                            <h2>Edit Track Details</h2>
                                            <div className={style.EditTrackTop}>

                                                <div
                                                    className={style.SwitchTrackBtn}
                                                    onClick={() => setTrackListHidden(false)}
                                                >

                                                    <span>{trackForEdit.name}</span>
                                                    <ListOverlay
                                                        itemList={selectedAlbum.track}
                                                        selectedItem={trackForEdit._id}
                                                        onSelectChange={onSelectTrackChange}
                                                        setHidden={setTrackListHidden}
                                                        isHiddden={isTrackListHidden}
                                                        isListLoaded
                                                    />
                                                    <span>Switch</span>

                                                </div>

                                                <div className={style.EditTrackGenre}>{selectedAlbum.genre.name}</div>

                                            </div>

                                            <div className={style.EditTrackCenter}>
                                                <div className={style.EditTrackLeft}>
                                                    <span
                                                        style={{ display: `${selectedTrackImgUrl ? 'flex' : 'none'}` }}
                                                    >
                                                        <LuImageMinus
                                                            onClick={onResetTrackImageBtnClick}
                                                        />
                                                    </span>
                                                    <img
                                                        src={selectedTrackImgUrl ? selectedTrackImgUrl : `http://localhost:8080/api/media/image/tracks/medium/${trackForEdit.cover.name}`}
                                                        alt='Track image'
                                                    />
                                                    <input
                                                        type="file"
                                                        onChange={onTrackImgChange}
                                                        ref={trackImageInputRef}
                                                        hidden
                                                        accept='image/*'
                                                    />
                                                    <span>
                                                        <TbPhotoEdit
                                                            onClick={() => {
                                                                trackImageInputRef.current.click()
                                                            }}
                                                        />
                                                    </span>
                                                </div>
                                                <div className={style.EditTrackRight}>

                                                    <div className={style.EditTrackTitle}>
                                                        <label>Track name</label>
                                                        <input
                                                            type="text"
                                                            value={'name' in updatedTrackData ? updatedTrackData.name : trackForEdit.name}
                                                            onChange={onTrackTitleChange}
                                                            onBlur={onTrackTitleBlur}
                                                        />
                                                    </div>

                                                    <div
                                                        className={style.EditTrackPreviewer}
                                                        style={{ display: `${'trackFile' in updatedTrackData ? 'flex' : 'none'}` }}
                                                    >

                                                        <label>Track preview</label>
                                                        <div className={style.EditTrackPlaybar}>

                                                            <span
                                                                onClick={onPlayPauseBtnClick}
                                                            >{editTrackPlaybackStates.isPlaying ? <IoPause /> : <IoPlay />}</span>

                                                            <InputRange
                                                                value={editTrackPlaybackStates.seekVal}
                                                                onChange={onEditTrackAudioSeek}
                                                            />

                                                            <div
                                                                className={style.ResetTrackBtn}
                                                                onClick={onResetTrackAudioBtnClick}
                                                            >
                                                                <PiMusicNotesMinusFill />
                                                            </div>

                                                            <span>{`${editTrackPlaybackStates.curTime} / ${editTrackPlaybackStates.duration}`}</span>

                                                        </div>

                                                    </div>

                                                    <div
                                                        className={style.EditTrackBtn}
                                                        onClick={() => trackAudioInputRef.current.click()}
                                                    >
                                                        Browse Track
                                                        <input
                                                            type="file"
                                                            accept='audio/*'
                                                            ref={trackAudioInputRef}
                                                            onChange={onTrackAudioChange}
                                                            hidden
                                                        />
                                                    </div>

                                                </div>
                                            </div>

                                            <div className={style.EditTrackBottom}>
                                                <div className={style.EditTrackFtArtistsWrapper}>
                                                    <label>Featured artists</label>
                                                    <div className={style.EditFtInputBox}>
                                                        <input
                                                            type="text"
                                                            placeholder='Add featured artist'
                                                            ref={featuredArtistInputRef}
                                                            onKeyDown={(e) => {
                                                                onFeaturedArtistKeyDown(e, featuredArtistInputRef);
                                                            }}
                                                        />
                                                        <span
                                                            onClick={(e) => {
                                                                addFeaturedArtist(featuredArtistInputRef);
                                                            }}
                                                        ><CgUserAdd /></span>
                                                    </div>
                                                    <div className={style.FtArtists}>
                                                        {
                                                            featuredArtists?.map((ftArtist, index) => {
                                                                return (
                                                                    <span
                                                                        key={index}
                                                                        onClick={() => removeFeaturedArtist(index)}
                                                                    >{ftArtist} <IoClose /></span>
                                                                )
                                                            })
                                                        }
                                                    </div>
                                                </div>

                                                <div className={style.EditTrackLanguage}>
                                                    <label>Language</label>
                                                    <span
                                                        onClick={() => setLanguageListHidden(false)}
                                                    >{'language' in updatedTrackData ? findNameById(languages, updatedTrackData.language) : trackForEdit.language.name}</span>
                                                    <ListOverlay
                                                        itemList={languages}
                                                        selectedItem={'language' in updatedTrackData ? updatedTrackData.language : trackForEdit.language._id}
                                                        onSelectChange={onTrackLanguageChange}
                                                        setHidden={setLanguageListHidden}
                                                        isHiddden={isLanguageListHidden}
                                                        isListLoaded={isListLoaded}
                                                    />
                                                </div>
                                            </div>

                                            <div className={style.EditTrackActionBtn}>
                                                <button
                                                    onClick={showRestoreDefaultPopup}
                                                >Restore default</button>
                                                <button
                                                    onClick={onUpdateTrack}
                                                >Update</button>
                                            </div>
                                        </div>
                                    }
                                </div>

                                {/* Delete Confirmation popup for track */}
                                <DeleteConfirmationPopup
                                    wrapperStyle={{ padding: '10px' }}
                                    popupStyle={{
                                        maxWidth: '450px',
                                        padding: '15px'
                                    }}

                                    title={'Delete Tracks?'}
                                    message={`Are you sure you want to delete ${tracksForDelete.length} tracks from "${selectedAlbum.title}"? This action cannot be undone.`}
                                    detailedMessage={
                                        `Selected track : ${selectedAlbum.track.filter(track => tracksForDelete.includes(track._id))
                                            .map(track => track.name).join(', ')}`
                                    }
                                    confirmationString={`${selectedAlbum.title} TRACKS`}

                                    onCancel={deleteTrackConfirmationPopupConfig.onCancel}
                                    onDelete={deleteTrackConfirmationPopupConfig.onDelete}
                                    isHidden={isDeleteTrackConfirmationPopupHidden}
                                />

                                {/* discard popup for album and track */}
                                <DiscardPopup
                                    wrapperStyle={{ padding: '10px' }}
                                    popupStyle={{ maxWidth: '400px' }}
                                    onDiscard={discardPopupConfig.onDiscard}
                                    onCancel={discardPopupConfig.onCancel}
                                    isHidden={isDiscardPopupHidden}
                                />

                                {/* restore track data */}
                                <RestoreDefaultPopup
                                    wrapperStyle={{ padding: '10px' }}
                                    popupStyle={{ maxWidth: '450px' }}
                                    changes={updatedTrackData}
                                    onRestore={restoreSomeUpdatedTrack}
                                    onCancel={hideRestoreDefaultPopup}
                                    isHidden={isRestoreDefaultPopupHidden}
                                />

                                {/* Information popup for Playback Interruption */}
                                <InfoPopup
                                    wrapperStyle={{ padding: '10px' }}
                                    popupStyle={{
                                        maxWidth: '450px',
                                        padding: '15px'
                                    }}
                                    title={"Playback Interrupted"}
                                    message={"Your playback has been paused as the track currently playing was selected for deletion. You may resume playback with a different track if needed."}

                                    onOk={infoPopupForTrackDeletionConfig.onOk}
                                    isHidden={infoPopupForTrackDeletionConfig.isHidden}
                                />
                            </div>
                            {/* loading for album and track */}
                            <LoaderContainer
                                loader={WavyPreloader}
                                isHidden={!isAlbumProcessing}
                            />
                        </>
                    }


                    {/* ------------------------------------------------------------------ skeleton Mobile sidebar */}
                    {
                        isMobileAlbumSidebarSkeletonLoading &&
                        <div className={style.SkeletonMobileAlbumSidebarContainer}>
                            <div className={style.SkHeader}>
                                <div className={`${style.SkTopArea}`}>
                                    <span className={`${style.Skeleton}`}></span>
                                    <div>
                                        <p className={`${style.Skeleton}`}></p>
                                        <p className={`${style.Skeleton}`}></p>
                                    </div>
                                    <span className={`${style.Skeleton}`}></span>
                                </div>
                                <div className={`${style.SkBottomArea}`}>
                                    <div className={`${style.SkBALeft} ${style.Skeleton}`}></div>
                                    <div className={style.SkBARight}>
                                        <div className={style.SkRTop}>
                                            <p className={style.Skeleton}></p>
                                            <p>
                                                <span className={style.Skeleton}></span>
                                                <span className={style.Skeleton}></span>
                                            </p>
                                        </div>
                                        <div className={style.SkRBottom}>
                                            <p>
                                                <span className={style.Skeleton}></span>
                                                <span className={style.Skeleton}></span>
                                            </p>
                                            <p>
                                                <span className={style.Skeleton}></span>
                                                <span className={style.Skeleton}></span>
                                            </p>
                                            <p>
                                                <span className={style.Skeleton}></span>
                                                <span className={style.Skeleton}></span>
                                            </p>
                                            <p>
                                                <span className={style.Skeleton}></span>
                                                <span className={style.Skeleton}></span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={`${style.SkBody}`}>
                                <p className={style.Skeleton}></p>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkTrack} ${style.Skeleton}`}></div>
                            </div>
                        </div>
                    }

                </div>

                {/* pop-up for invalid refresh token */}
                {
                    !tokenInfo.isValidToken &&
                    <div className={`${style.PopUpWrapper}`}>
                        <div className={style.RedirectPopUp}>
                            <h2>Your session has expired.</h2>
                            <p>Your session has ended. Please sign in again to continue.</p>
                            <Link to='/'>Sign in</Link>
                        </div>
                    </div>
                }

                {/* pop-up for display error */}
                {
                    initSrcError.isError &&
                    <div className={style.ErrorContainer}>
                        <h1>Oops!!!</h1>
                        <div className={style.ErrorContent}>
                            <p>{initSrcError.message}</p>
                            <ul>
                                {
                                    initSrcError?.tips?.map((tip) => {
                                        return (
                                            <li>{tip}</li>
                                        )
                                    })}
                            </ul>
                            <div className={style.Btns}>
                                <NavLink to={'/'}>Login</NavLink>
                                <button onClick={() => {
                                    window.location.reload()
                                }}>Refresh</button>
                            </div>
                        </div>
                    </div>
                }

                {/* pop-up for display information of audio interuption */}
                {
                    !isAudioConflictPopUpHidden &&
                    <div className={style.PopUpWrapper}>
                        <div className={style.AudioConflictInfoPopUp}>
                            <h2>Album playback stopped</h2>
                            <p>To ensure a smooth experience while uploading or creating new tracks, your current album playback has been stopped.</p>
                            <Checkbox
                                label="Don't show me again"
                                onCheckChange={handleAudioConflictPopUpCheckboxChange}
                            />
                            <button onClick={() => setAudioConflictPopUpHidden(true)}>Continue</button>
                        </div>
                    </div>
                }

                {/* pop-up for display Warnning about browser not supporting shaka player */}
                {
                    !isShakaSupported && !isPlayerNotSuppotedWarnPopUpHidden &&
                    <div className={style.PopUpWrapper}>
                        <div className={style.PlayerNotSuppotedWarnPopUp}>

                            <div className={style.PopUpTop}>
                                <h2>Browser Incompatibility Detected</h2>
                                <span>It seems that your browser does not support some of the advanced features of our audio player.</span>
                                <p>To provide the best listening experience, we use advanced technology that may not be compatible with your current browser. However, you can still enjoy your favorite music with a basic audio player.</p>
                            </div>

                            <div className={style.PopUpCenter}>
                                <h2>What This Means for You:</h2>

                                <div className={style.ItemList}>
                                    <div className={style.Item}>
                                        <span><GoDotFill />Limited Audio Quality:</span>
                                        <p>The sound quality may not be as high as with our advanced player.</p>
                                    </div>
                                    <div className={style.Item}>
                                        <span><GoDotFill />Playback Features:</span>
                                        <p>Some features that enhance your experience will not be available. These include:</p>
                                    </div>
                                </div>

                                <div className={style.ItemList}>
                                    <div className={style.Item}>
                                        <span><GoDotFill />Smooth Streaming:</span>
                                        <p>The audio may take longer to start and could buffer during playback.</p>
                                    </div>
                                    <div className={style.Item}>
                                        <span><GoDotFill />Automatic Quality Adjustment:</span>
                                        <p>Your audio won't automatically adjust to changing internet speeds.</p>
                                    </div>
                                </div>

                            </div>

                            <div className={style.PopUpBottom}>
                                <h2>Recommended Browsers for Optimal Experience</h2>

                                <p>For the best audio experience, we recommend using one of the following browsers:</p>

                                <div className={style.ItemList}>
                                    <div className={style.Item}>
                                        <span><GoDotFill />Google Chrome</span>
                                        <span><GoDotFill />Mozilla Firefox</span>
                                        <span><GoDotFill />Microsoft Edge</span>
                                        <span><GoDotFill />Safari</span>
                                    </div>
                                </div>

                                <p>You can find more information about supported browsers <a href="https://github.com/shaka-project/shaka-player/blob/main/README.md">here.</a></p>
                            </div>

                            <button onClick={() => setPlayerNotSuppotedWarnPopUpHidden(true)}>Use anyway</button>

                        </div>
                    </div>
                }
                <Toaster />
                <ToastContainer />
            </div>
        </MasterLayoutContextProvider >
    )
}

export default MasterLayout