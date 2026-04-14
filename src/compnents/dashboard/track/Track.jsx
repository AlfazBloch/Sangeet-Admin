import { useCallback, useEffect, useRef, useState } from 'react';
import { useMasterLayout } from '../layout.context';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../../app.css';

import style from './style.module.css'
import utilstyle from '../../util.module.css'

import { defaultAlbumImage, defaultTrackImage } from '../../../assets';
import { FetchWithAuthError, GoIssueTrackedBy, IoClose, IoAdd, RiTeamLine, MdCategory, IoLanguage, IoPlay, IoPause, PiMusicNotesPlusFill, BiPhotoAlbum, RiImageAddLine, removeKeyFromObj, fetchWithAuth, LuTextCursorInput, extractDataFromObjOfObj, toastOption, formatTime, getItemFromLocalStorage } from '../../../utility'
import Dropdown from '../reusable/Dropdown';
import InitSrcLoader from '../reusable/InitSrcLoader';
import WavyPreloader from '../../loaders/WavyPreloader';
import InputRange from '../reusable/InputRange';


function Track() {

    // -----------------------------------for create album section----------------------------
    //use masterLayout
    const { closeALbumSidebar, setInitSrcError, setTokenInfo, setAudioConflictPopUpHidden, selectedTrack, selectedAlbum } = useMasterLayout();

    //useStates
    const [isAlbumSnippetHide, setAlbumSnippetHide] = useState(true);
    const [albumErrors, setAlbumErrors] = useState({});
    const [genres, setGenres] = useState([]);
    const [isLoading, setLoading] = useState(false);
    const [isInitSrcLoaded, setInitSrcLoaded] = useState(false);
    const [createAlbumData, setAlbumData] = useState({
        genre: {
            id: '',
            value: 'Select Genre',
            isEmpty: true,
            error: 'Please Select Genre'
        },
        title: {
            value: '',
            isEmpty: true,
            error: 'Please Enter Title'
        },
        albumImage: {
            value: null,
            isEmpty: true,
            error: 'Please Select Album Image',
            selectedImage: null
        }
    });

    //useRefs
    const albumImageRef = useRef();

    //remove album error
    const removeAlbumError = (key) => {
        const newError = removeKeyFromObj(albumErrors, key);
        setAlbumErrors(newError);
    }
    // manuppulate state
    const manupulateAlbumData = (key, obj) => {
        setAlbumData((prev) => {
            return { ...prev, [key]: obj }
        })
    }
    //handle album title change
    const handleAlbumTitleChange = (e) => {
        const value = e.target.value;
        const isEmpty = !value.length > 0;
        manupulateAlbumData('title', { ...createAlbumData.title, value, isEmpty });
        removeAlbumError('title')
    }
    //handle image change
    const handleAlbumImage = (e) => {
        const file = e.target.files[0];
        const type = file.type.split('/')[0];
        if (type !== 'image') {
            const value = null;
            const isEmpty = true;
            const error = 'File must be an Image';
            const selectedImage = null;
            manupulateAlbumData('albumImage', { value, isEmpty, error, selectedImage });
            toast.error(error, toastOption)
            return;
        }
        const albumImage = new FileReader();
        albumImage.readAsDataURL(file);
        albumImage.addEventListener('load', (e) => {
            const selectedImage = e.target.result;
            manupulateAlbumData('albumImage', { ...createAlbumData.albumImage, value: file, isEmpty: false, selectedImage });
        })
    }
    // validate album data
    const validateAlbumData = (obj) => {
        let isValidate = true
        let errors = ''
        for (const key in obj) {
            if (key == 'albumImage' && obj[key].isEmpty) {
                isValidate = false
                toast.error('Please Select Album Image', toastOption)
            }
            else if (obj[key].isEmpty) {
                isValidate = false
                errors += obj[key].error + ', '
                setAlbumErrors((prev) => {
                    return { ...prev, [key]: obj[key].error }
                })
            }
        }
        return isValidate;
    }


    // --------------------------------------handle album------------------------------------------------
    const handleAlbumCreate = async () => {
        try {
            if (!validateAlbumData(createAlbumData)) return;
            setLoading(true);
            const albumData = new FormData();
            for (const key in createAlbumData) {
                if (key === 'genre') {
                    albumData.append(key, createAlbumData[key].id);
                }
                else if (key === 'title') {
                    albumData.append(key, createAlbumData[key].value.trim());
                }
                else {
                    albumData.append(key, createAlbumData[key].value);
                }
            }

            const resData = await fetchWithAuth('http://localhost:8080/api/albums', {
                method: 'post',
                credentials: 'include',
                body: albumData
            });
            if (resData.status >= 400) {
                throw new FetchWithAuthError(resData.data, 'http error')
            }
            if (resData.isRedirect) {
                setTokenInfo({ isValidToken: false, message: resData.message });
                setAlbumSnippetHide(true);
                return;
            }
            setAlbumSnippetHide(true);
            toast.success('Album Added.', toastOption)
            setAlbums((prev) => {
                let allAlbum = prev;
                allAlbum.push(resData.data);
                return allAlbum;
            })
            setAlbumData({
                genre: {
                    id: '',
                    value: 'Select Genre',
                    isEmpty: true,
                    error: 'Please Select Genre'
                },
                title: {
                    value: '',
                    isEmpty: true,
                    error: 'Please Enter Title'
                },
                albumImage: {
                    value: null,
                    isEmpty: true,
                    error: 'Please Select Album Image',
                    selectedImage: null
                }
            })
            setLoading(false);
        }
        catch (error) {
            if (error instanceof FetchWithAuthError) {
                const err = error.errorObj;
                if (err?.code === 1) {
                    const errMsg = {}
                    for (const key in err.errors) {
                        if (key === 'albumImage') {
                            toast.error('Album image is required', toastOption);
                        }
                        else {
                            errMsg[key] = `${key} is required`;
                        }
                    }
                    setAlbumErrors(errMsg)
                }
                else {
                    let message = '';
                    for (const key in err.errors) {
                        message = err.errors[key].message
                    }
                    toast.error(message, toastOption);
                }
            }
            else if (error.name === 'TypeError') {
                toast.error('Network error: Please check your internet connection   .', toastOption);
            }
            else {
                console.log(error);
                toast.error('Error occured while creating track', toastOption);
            }
            setLoading(false);
        }
    }

    // -----------------------------------for track info section----------------------------
    const [albums, setAlbums] = useState([]);
    const [albumGenre, setAlbumGenre] = useState();
    const [languages, setLanguages] = useState([]);
    const [isLanguageExpanded, setLanguageExpanded] = useState(false);
    const [trackData, setTrackData] = useState({
        name: {
            value: '',
            isEmpty: true,
            error: 'Track name is required'
        },
        trackImage: {
            value: null,
            isEmpty: true,
            selectedImage: null,
            error: 'Track image is required'
        },
        duration: {
            value: 0,
        },
        language: {
            value: 'Select Language',
            isEmpty: true,
            id: '',
            error: 'Language is required'
        },
        featuredArtists: {
            value: '',
            list: []
        },
        trackFile: {
            value: null,
            isEmpty: true,
            error: 'Track is required'
        },
        album: {
            value: 'Select Album',
            isEmpty: true,
            id: '',
            error: 'Album is required'
        }
    })

    const manupulateTrackData = (key, obj) => {
        setTrackData((prev) => {
            return { ...prev, [key]: obj }
        })
    }
    const handleTrackNameChange = (e) => {
        const value = e.target.value;
        const isEmpty = !value.length > 0;
        manupulateTrackData('name', { ...trackData.name, value, isEmpty });
    }
    const handlleFtArtistsChange = (e) => {
        const value = e.target.value;
        const newObj = { ...trackData.featuredArtists, value };
        manupulateTrackData('featuredArtists', newObj);
    }
    const handlleAddFtArtist = () => {
        const newFtArtist = trackData.featuredArtists.value.trim();
        if (!newFtArtist) return;

        const value = '';
        const ftArtistList = [...trackData.featuredArtists.list];
        if (ftArtistList.length >= 12) {
            toast.warning('Maximum feature artist limit exceeded.', toastOption)
            return
        }
        ftArtistList.push(newFtArtist);
        manupulateTrackData('featuredArtists', { value, list: ftArtistList })
    }
    const handleRemoveFtArtist = (index) => {
        const ftArtistList = [...trackData.featuredArtists.list];
        ftArtistList.splice(index, 1)
        manupulateTrackData('featuredArtists', { ...trackData.featuredArtists, list: ftArtistList });
    }


    //--------------------------------------for track image section ------------------------------------
    const trackImageRef = useRef();

    const handleTrackImage = () => {
        const file = trackImageRef.current.files[0];
        if (file) {
            const type = file.type.split('/')[0];
            let value = null;
            let isEmpty = true;
            let selectedImage = null;
            if (type !== 'image') {
                manupulateTrackData('trackImage', { ...trackData.trackImage, value, isEmpty, selectedImage });
                toast.error('Selected file must be an image.', toastOption);
                return;
            }
            const reader = new FileReader();
            reader.addEventListener('load', (e) => {
                const result = e.target.result;
                value = file;
                isEmpty = false;
                selectedImage = result;
                manupulateTrackData('trackImage', { ...trackData.trackImage, value, isEmpty, selectedImage });
            })
            reader.readAsDataURL(file);
        }
    }

    // ------------------------------------HANDLE AUDIO PLAYBACK----------------------------------------
    const [audioSrc, setAudioSrc] = useState(null);
    const [trackCurrentTime, setTrackCurrentTime] = useState('00:00');
    const [trackDuration, setTrackDuration] = useState('');
    const [seekBarValue, setSeekBarValue] = useState(0);
    const [isAudioPlaying, setAudioPlaying] = useState(false);
    const audioElementRef = useRef(new Audio());
    const trackFileRef = useRef();

    const handleTrackFile = async () => {
        try {
            const file = trackFileRef.current.files[0];
            let value = null;
            let isEmpty = true;
            const type = file.type.split('/')[0];

            if (type !== 'audio') {
                manupulateTrackData('trackFile', { ...trackData.trackFile, value, isEmpty });
                toast.error('Selected file must be an audio', toastOption);
                return;
            }

            manupulateTrackData('trackFile', { ...trackData.trackFile, value: file, isEmpty: false });
            setAudioSrc(URL.createObjectURL(file));
            if (selectedAlbum || selectedTrack) {
                const keepAudioConflictInfoPopUpHidden = getItemFromLocalStorage('keepAudioConflictInfoPopUpHidden', 'bool');
                closeALbumSidebar();

                if (keepAudioConflictInfoPopUpHidden) return;
                setAudioConflictPopUpHidden(false);
            }
        }
        catch (error) {
            let errorMessage = "An unexpected error occurred while processing the audio file. Please try again.";
            if (error instanceof DOMException) {
                if (error.name === "NotSupportedError") {
                    errorMessage = "The selected file format is not supported. Please upload a valid audio file.";
                } else if (error.name === "EncodingError") {
                    errorMessage = "The audio file could not be decoded. Please try again with a different file.";
                }
            }
            toast.error(errorMessage, toastOption);
        }
    }
    const togglePlayPauseAudio = useCallback(async () => {
        try {
            const audio = audioElementRef.current;
            if (isAudioPlaying) {
                audio.pause();
            }
            else {
                await audio.play()
            }
            setAudioPlaying((prev) => !prev);
        }
        catch (error) {
            console.log(error)
            toast.error('Sorry, Audio can not be play, please select audio again.', toastOption);
        }
    }, [isAudioPlaying]);

    const handleAudioSeek = (value) => {
        const audio = audioElementRef.current;
        if (!audio.duration) return;
        setSeekBarValue(value);
        const time = (value * audio.duration) / 100;
        audio.currentTime = time;
    }

    // ---------------------------- Validate & serv to the server -----------------
    const validateTrackData = () => {
        let delay = 0;
        let isValidate = true;
        for (const key in trackData) {
            if (key === 'duration' || key === 'featuredArtists') continue;
            if (trackData[key].isEmpty) {
                toast.error(trackData[key].error, { ...toastOption, delay });
                delay += 300;
                isValidate = false;
            }
        }
        return isValidate;
    }
    const handleTrackCreate = async () => {
        try {
            if (!validateTrackData()) return;
            setLoading(true);
            const formData = new FormData();
            for (const key in trackData) {
                if (key === 'album' || key === 'language') {
                    formData.append(key, trackData[key].id);
                }
                else if (key === 'featuredArtists') {
                    formData.append(key, JSON.stringify(trackData[key].list));
                }
                else if (key === 'name') {
                    formData.append(key, trackData[key].value.trim());
                }
                else {
                    formData.append(key, trackData[key].value);
                }
            }
            const resData = await fetchWithAuth('http://localhost:8080/api/tracks', {
                method: 'post',
                credentials: 'include',
                body: formData
            });
            if (resData.status >= 400) {
                throw new FetchWithAuthError(resData.data, 'http error');
            }
            if (resData.isRedirect) {
                setTokenInfo({ isValidToken: false, message: resData.message });
                return;
            }
            toast.success('Track Added.', toastOption);
            setAlbumGenre('');
            setTrackData({
                name: {
                    value: '',
                    isEmpty: true,
                    error: 'Track name is required'
                },
                trackImage: {
                    value: null,
                    isEmpty: true,
                    selectedImage: null,
                    error: 'Track image is required'
                },
                duration: {
                    value: 0,
                },
                language: {
                    value: 'Select Language',
                    isEmpty: true,
                    id: '',
                    error: 'Language is required'
                },
                featuredArtists: {
                    value: '',
                    list: []
                },
                trackFile: {
                    value: null,
                    isEmpty: true,
                    error: 'Track is required'
                },
                album: {
                    value: 'Select Album',
                    isEmpty: true,
                    id: '',
                    error: 'Album is required'
                }
            });
            setLoading(false);

            const audio = audioElementRef.current;
            audio.pause();
            audio.src = '';
            audio.load();
            URL.revokeObjectURL(audioSrc);
            setAudioSrc(null);
            setTrackDuration('00:00');
            setTrackCurrentTime('00:00');
            setSeekBarValue(0);
            setAudioPlaying(false);
        }
        catch (error) {
            if (error instanceof FetchWithAuthError) {
                const err = error.errorObj;
                if (err?.code === 1) {
                    const errMessages = extractDataFromObjOfObj(err.errors, 'message');
                    let delay = 0;
                    for (const key in errMessages) {
                        if (key === 'album') {
                            toast.error('Album is required', { ...toastOption, delay });
                        }
                        else {
                            toast.error(errMessages[key], { ...toastOption, delay });
                        }
                        delay += 400;
                    }
                }
                else {
                    let message = '';
                    for (const key in err.errors) {
                        message = err.errors[key].message
                    }
                    toast.error(message, toastOption);
                }
            }
            else if (error.name === 'TypeError') {
                toast.error('Network error: Please check your internet connection.', toastOption);
            }
            else {
                console.log(error);
                toast.error('Error occured while creating track', toastOption);
            }
            setLoading(false);
        }
    }

    // ----------------------------- when compnent mount----------------------------
    useEffect(() => {
        const fetchInitialResource = async () => {
            try {
                // fetch res at intial stages
                const genres = await fetchWithAuth('http://localhost:8080/api/genres', {
                    method: 'get',
                    credentials: 'include'
                })
                const albums = await fetchWithAuth('http://localhost:8080/api/albums', {
                    method: 'get',
                    credentials: 'include'
                })
                const languages = await fetchWithAuth('http://localhost:8080/api/languages', {
                    method: 'get',
                    credentials: 'include'
                })

                if (genres.status >= 400) {
                    throw new FetchWithAuthError(genres, 'http error');
                }
                else if (albums.status >= 400) {
                    throw new FetchWithAuthError(albums, 'http error');
                }
                else if (languages.status >= 400) {
                    throw new FetchWithAuthError(languages, 'http error');
                }
                // handle response of server
                if (genres.isRedirect || albums.isRedirect || languages.isRedirect) {
                    const message = albums.message || genres.message || languages.message;
                    setTokenInfo({ isValidToken: false, message });
                    return;
                }
                setInitSrcLoaded(true);
                setGenres(genres.data);
                setAlbums(albums.data);
                setLanguages(languages.data);
            }
            catch (error) {
                if (error.name === 'TypeError') {
                    setInitSrcError({ isError: true, message: 'Network error, Please check your internet connection.', tips: ['Ensure you have a stable internet connection.', 'Please refresh the page once your network is stable.', 'Try opening other websites to see if they load.', "If the issue persists, contact the website's support team for further assistance."] });
                }
                else if (error instanceof FetchWithAuthError) {
                    setInitSrcError({ isError: true, message: 'Something went wrong on our end. Please try again later.', tips: ['The server might be down or experiencing issues.', 'Unexpected error occurred. Refresh the page or contact support.', 'Server error detected. Please bear with us as we resolve it.'] });
                }
                else {
                    console.log(error);
                }
            }
        }
        fetchInitialResource();
    }, []);

    // ----------------------------- to load audio on audio element----------------------------
    useEffect(() => {
        const audio = audioElementRef.current;
        // listeners
        const onLoadedMetadata = () => {
            setTrackDuration(formatTime(audio.duration));
            manupulateTrackData('duration', { value: audio.duration });
        }
        const onTimeUpdate = () => {
            if (!audio.duration) return;
            const seekTime = (audio.currentTime * 100) / audio.duration;
            setSeekBarValue(seekTime);
            setTrackCurrentTime(formatTime(audio.currentTime));
        }
        const onEnded = () => {
            setAudioPlaying(false);
            audio.currentTime = 0;
            setSeekBarValue(0);
        }

        // Events
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);

            audio.pause();
            if (audioSrc) URL.revokeObjectURL(audioSrc);
        }
    }, []);

    // ----------------------------- for audio playback (track section)----------------------------
    useEffect(() => {
        const audio = audioElementRef.current;
        if (audioSrc) {
            audio.src = audioSrc;
            audio.load();
            setAudioPlaying(false);
            setTrackCurrentTime('00:00');
            setSeekBarValue(0);
            return () => {
                if (audioSrc) URL.revokeObjectURL(audioSrc);
            }
        }
    }, [audioSrc]);

    // ----------------------------- togglePlayPauseAudio on spacebar press ----------------------------
    useEffect(() => {
        const onKeyDown = (e) => {
            const activeElement = document.activeElement;
            const isInputActive = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

            if (e.code === 'Space' && !isInputActive && audioElementRef.current) {
                e.preventDefault();
                togglePlayPauseAudio();
            }
        }
        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
        }
    }, [togglePlayPauseAudio])

    // ----------------------------- when albums selects----------------------------
    useEffect(() => {
        const getAlbumById = async () => {
            try {
                if (!trackData.album.isEmpty) {
                    const album = await fetchWithAuth(`http://localhost:8080/api/albums/${trackData.album.id}`, {
                        method: 'get',
                        credentials: 'include'
                    });
                    if (album.status >= 400) {
                        throw new FetchWithAuthError(album, 'http error');
                    }
                    if (album.isRedirect) {
                        const message = album.message;
                        setTokenInfo({ isValidToken: false, message });
                        return;
                    }
                    setAlbumGenre(album.data?.genre.name)
                }
            }
            catch (error) {
                if (error.name === 'TypeError') {
                    toast.error('Network error: Please check your internet connection.', toastOption);
                }
                else if (error instanceof FetchWithAuthError) {
                    let message = '';
                    let errors = error.errorObj.data.errors;
                    for (const key in errors) {
                        message = errors[key].message
                    }
                    toast.error(message, toastOption);
                }
                else {
                    console.log(error);
                    toast.error('Error occured while fetching albums', toastOption);
                }
            }
        }
        getAlbumById()
    }, [trackData.album])

    return (
        <>
            {isInitSrcLoaded ?
                <div className={style.Track}>
                    <h1 className={style.TrackHeading}>Upload music tracks to your album</h1>
                    <div className={style.SelectOrCreateAlbum}>
                        <div className={style.AlbumSelector}>
                            <Dropdown initialText={'Select Album'} listItems={albums} listKey='title' dataKey='album' dataValue={trackData.album} onChange={manupulateTrackData} />
                        </div>
                        <div
                            className={style.CreateAlbumBtn}
                            onClick={() => { setAlbumSnippetHide((prev) => !prev) }}
                        >
                            <BiPhotoAlbum />
                            <span>Create Album</span>
                        </div>

                        {/* create album snippet */}
                        <div
                            className={`${style.SnippetContainer} ${isAlbumSnippetHide ? utilstyle.Hide : ''}`}
                            onClick={() => {
                                setAlbumSnippetHide(true)
                            }}
                        >
                            <div
                                className={`${style.AlbumSnippet}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >

                                {/* -----------left side----------------- */}
                                {/* album info */}
                                <div className={style.AlbumInfo}>
                                    <h2>Create your own album</h2>
                                    <div>
                                        <div
                                            className={style.GenreDropdown}
                                            onClick={() => removeAlbumError('genre')}
                                        >
                                            <Dropdown initialText={'Select Genre'} listItems={genres} listKey='name' onChange={manupulateAlbumData} dataValue={createAlbumData.genre} dataKey='genre' />
                                        </div>
                                        <div className={`${style.ErrorBox} ${!albumErrors.genre ? utilstyle.Hide : ''}`}>
                                            {albumErrors?.genre}
                                        </div>
                                    </div>

                                    <div>
                                        <div className={style.AlbumTitle}>
                                            <input
                                                type="text"
                                                placeholder='Album Title'
                                                value={createAlbumData.title.value}
                                                onChange={handleAlbumTitleChange}
                                            />
                                        </div>
                                        <div className={`${style.ErrorBox} ${!albumErrors.title ? utilstyle.Hide : ''}`}>
                                            {albumErrors?.title}
                                        </div>
                                    </div>

                                    <div
                                        className={style.CreateBtn}
                                        onClick={handleAlbumCreate}
                                    >
                                        <span>Create</span>
                                    </div>

                                </div>

                                {/* -----------right side----------------- */}
                                {/* album image */}
                                <div className={style.AlbumImage}>
                                    <img src={`${createAlbumData.albumImage.selectedImage ? createAlbumData.albumImage.selectedImage : defaultAlbumImage}`} />
                                    <input type="file" accept='image/*' style={{ display: 'none' }} ref={albumImageRef} onChange={handleAlbumImage} />
                                    <div
                                        className={style.AddAlbumImageBtn}
                                        onClick={() => albumImageRef.current.click()}
                                    >
                                        <RiImageAddLine />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    {/* --------------create track section------------------- */}
                    <div className={style.TrackMainInfoNImage}>
                        <div className={style.TrackImage}>
                            <img src={`${trackData.trackImage.selectedImage ? trackData.trackImage.selectedImage : defaultTrackImage}`} alt="" />
                            <div className={`${style.TrackPlayArea} ${!audioSrc ? utilstyle.Hide : ''}`}>
                                <div
                                    className={style.TrackPlayPauseBtn}
                                    onClick={togglePlayPauseAudio}
                                >
                                    {isAudioPlaying ? <IoPause /> : <IoPlay />}
                                </div>
                                <div className={style.Seekbar}>
                                    <InputRange
                                        value={seekBarValue}
                                        onChange={handleAudioSeek}
                                    />
                                </div>
                                <span className={style.Duration}>{`${trackCurrentTime}/${trackDuration}`}</span>
                            </div>
                            <div
                                className={style.AddTrackImageBtn}
                                onClick={() => trackImageRef.current.click()}
                            >
                                <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    ref={trackImageRef}
                                    onChange={handleTrackImage}
                                    accept='image/*'
                                />
                                <span>
                                    <RiImageAddLine />
                                </span>
                                <p>Track Image</p>
                            </div>
                        </div>
                        <div className={style.TrackInfo}>

                            {/* name & file selection */}
                            <div className={style.NameNGenre}>
                                <div className={style.TrackName}>
                                    <input
                                        type="text"
                                        placeholder='Track name'
                                        value={trackData.name.value}
                                        onChange={handleTrackNameChange}
                                    />
                                    <LuTextCursorInput />
                                </div>
                                <div className={`${style.Genre} ${!albumGenre ? utilstyle.Hide : ''}`}>
                                    <span>{albumGenre}</span>
                                    <MdCategory />
                                </div>
                            </div>

                            {/* ft. artist section*/}
                            <div className={style.FeatureArtistSection}>
                                <div className={style.AddFtArtist}>
                                    <div className={style.InputWrapper}>
                                        <input
                                            type="text"
                                            placeholder='Add featured artist (optional)'
                                            value={trackData.featuredArtists.value}
                                            onChange={handlleFtArtistsChange}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handlleAddFtArtist()
                                                }
                                            }}
                                        />
                                        <RiTeamLine />
                                    </div>
                                    <div
                                        className={style.AddFtBtn}
                                        onClick={handlleAddFtArtist}
                                    >
                                        <IoAdd />
                                    </div>
                                </div>
                                <div className={style.FtArtistList}>
                                    {trackData.featuredArtists.list.map((ftArtist, index) => {
                                        return (
                                            <div
                                                className={style.FtArtist}
                                                key={index}
                                            >
                                                <p>{ftArtist}</p>
                                                <span
                                                    className={style.DelFtBtn}
                                                    onClick={() => {
                                                        handleRemoveFtArtist(index)
                                                    }}
                                                > <IoClose /> </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* genre & lanuage */}
                            <div className={style.TrackFileNLanguage}>
                                <div
                                    className={style.LanguageSelector}
                                    onClick={() => setLanguageExpanded((prev) => !prev)}
                                >
                                    <span>{trackData.language.value}</span>
                                    <IoLanguage className={`${isLanguageExpanded ? utilstyle.RotateY180 : ''}`} />
                                    <div
                                        className={`${style.LanguageList} ${!isLanguageExpanded ? utilstyle.Hide : ''} `}
                                        onMouseLeave={() => setLanguageExpanded(false)}
                                    >
                                        {languages.map(({ name, _id }) => {
                                            return (
                                                <span
                                                    key={_id}
                                                    onClick={() => {
                                                        manupulateTrackData('language', { ...trackData.language, value: name, id: _id, isEmpty: false })
                                                    }}
                                                >{name}</span>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div
                                    className={style.TrackSelectBtn}
                                    onClick={() => trackFileRef.current.click()}
                                >
                                    <input
                                        type="file"
                                        style={{ display: 'none' }}
                                        ref={trackFileRef}
                                        onChange={handleTrackFile}
                                        accept='audio/*'
                                    />
                                    <span>Add track</span>
                                    <PiMusicNotesPlusFill />
                                </div>
                            </div>

                            {/* add track btn */}
                            <div
                                className={style.CreateTrackBtn}
                                onClick={handleTrackCreate}
                            >
                                <GoIssueTrackedBy />
                                <span>Create Track</span>
                            </div>

                        </div>
                    </div>
                    {/* <ToastContainer /> */}
                    <div className={`${utilstyle.LoaderContainer} ${isLoading ? utilstyle.ShowFlex : utilstyle.Hide}`}>
                        <WavyPreloader />
                    </div>
                </div>
                :
                <InitSrcLoader />
            }
        </>
    )
}

export default Track
