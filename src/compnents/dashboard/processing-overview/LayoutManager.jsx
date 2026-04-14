import { useCallback, useEffect, useRef, useState } from 'react'
import style from './style.module.css'

import NodeContainer from './NodeContainer.jsx'

import { FaPlay, FaStop, fetchWithAuth, FetchWithAuthError, MdRefresh, toastOption } from '../../../utility.js'
import { LayoutManagerContextProvider } from './manager.context.js';
import FailedAlbums from './FailedAlbums.jsx';
import FailedTracks from './FailedTracks.jsx';
import { toast } from 'react-toastify';
import { useMasterLayout } from '../layout.context.js';

function LayoutManager({ processedUnpublishedAlbums, fetchUnpublishedAlbums = () => { }, lastRefreshTime = 0, formatLastRefreshTime = () => { }, handleLoading = () => { }, updateProcessedUnpublishedAlbum = () => { }, rawUnpublishedAlbums, updateRawUnpublishedAlbums }) {
    const { setTokenInfo } = useMasterLayout();

    // awaiting process realated states and methods
    const [toggleStatus, setToggleStatus] = useState('processing');
    const [openedAwaitingAlbums, setOpenedAwaitingAlbums] = useState([]);
    const [openedAwaitingTracks, setOpenedAwaitingTracks] = useState([]);

    const getTotalProcesses = () => {
        const pending = processedUnpublishedAlbums.pending.reduce((accum, album) => {
            return accum + album.totalProcesses;
        }, 0);
        const processing = processedUnpublishedAlbums.processing.reduce((accum, album) => {
            return accum + album.totalProcesses;
        }, 0);
        return pending + processing;
    }
    const handleToggleStatus = () => {
        setToggleStatus(prev => prev === 'processing' ? 'pending' : 'processing');
    }

    const handleOpenAwaitingAlbum = (albumId) => {
        const albums = [...openedAwaitingAlbums];
        const openedAlbumIndex = albums.findIndex(id => id === albumId);
        if (openedAlbumIndex >= 0) {
            albums.splice(openedAlbumIndex, 1);
        }
        else {
            albums.push(albumId);
        }
        setOpenedAwaitingAlbums(albums);
    }
    const handleOpenAwaitingTrack = (trackId) => {
        const tracks = [...openedAwaitingTracks];
        const openedTrackIndex = tracks.findIndex(id => id === trackId);
        if (openedTrackIndex >= 0) {
            tracks.splice(openedTrackIndex, 1);
        }
        else {
            tracks.push(trackId);
        }
        setOpenedAwaitingTracks(tracks);
    }
    const resetSelectedAlbumFile = () => {
        setSelectedAlbumFile(null);
    }

    // failed process realated states and methods
    const [toggleFailedOperationList, setToggleFailedOperationList] = useState('albums');
    const [selectedAlbumFile, setSelectedAlbumFile] = useState(null);
    const [selectedTrackFiles, setSelectedTrackFiles] = useState(null);
    const [openedFailedTracks, setOpenedFailedTracks] = useState([]);

    const handleToggleFailedOperationList = (type) => {
        let list;
        if (type === 'albums') {
            list = 'albums';
            resetSelectedTrackFiles();
            setOpenedFailedTracks([]);
        } else {
            list = 'tracks';
            resetSelectedAlbumFile();
        }
        setToggleFailedOperationList(list);
    }
    const handleOpenFailedTracks = (id) => {
        const tracks = [...openedFailedTracks];

        const trackIndex = tracks.findIndex(ele => ele === id);
        if (trackIndex >= 0) {
            tracks.splice(trackIndex, 1);
        }
        else {
            tracks.push(id);
        }
        setOpenedFailedTracks(tracks);
    }

    // audio handling related states and methods
    const [audioPlaybackState, setAudioPlaybackState] = useState({
        isPlaying: false,
        duration: 0,
        currentTime: 0,
        seekValue: 0
    })
    const [isLargeScreen, setLargeScreen] = useState(window.innerWidth > 1200);
    const audioElementRef = useRef(null);

    const handleAudioPlayPause = useCallback(async () => {
        const audio = audioElementRef.current;
        if (audio) {
            try {
                if (audioPlaybackState.isPlaying) {
                    audio.pause();
                }
                else {
                    await audio.play();
                }
            }
            catch (error) {
                console.log(error);
                return toast.error('Sorry, Audio can not be play, please select audio again.', toastOption);
            }


            setAudioPlaybackState(prev => {
                return { ...prev, isPlaying: !prev.isPlaying }
            })
        }
    }, [audioPlaybackState.isPlaying]);
    const handleAudioSeek = (value) => {
        const audio = audioElementRef.current;
        if (!audio.duration) return;

        const currentTime = (value * audio.duration) / 100;

        audio.currentTime = currentTime;
        setSelectedTrackFiles(prev => {
            return { ...prev, seekValue: value, currentTime }
        })
    }
    const resetSelectedTrackFiles = () => {
        setSelectedTrackFiles(null);

        audioElementRef.current.pause();
        if (selectedTrackFiles?.audio) {
            URL.revokeObjectURL(selectedTrackFiles.audio.objectUrl);
        }
    }

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.code === 'Space' && selectedTrackFiles?.audio?.objectUrl) {
                handleAudioPlayPause();
            }
        }
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
        }
    }, [selectedTrackFiles?.audio?.objectUrl, handleAudioPlayPause]);
    useEffect(() => {
        const objectUrl = selectedTrackFiles?.audio?.objectUrl;
        if (objectUrl) {
            const audio = audioElementRef.current;
            audio.src = objectUrl;
            audio.load();
            setAudioPlaybackState({
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                seekValue: 0
            })
            return () => {
                URL.revokeObjectURL(objectUrl);
                audioElementRef.current.pause();
            }
        }
    }, [selectedTrackFiles?.audio?.objectUrl])
    useEffect(() => {
        const audio = new Audio();
        audioElementRef.current = audio;

        const onLoadedMetadata = () => {
            const duration = audio.duration;
            setAudioPlaybackState(prev => {
                return { ...prev, duration }
            })
            setSelectedTrackFiles(prev => {
                return { ...prev, audio: { ...prev.audio, duration } }
            })
        }
        const onTimeUpdate = () => {
            if (!audio.duration) return;
            const seekValue = (audio.currentTime * 100) / audio.duration;
            setAudioPlaybackState(prev => {
                return { ...prev, seekValue, currentTime: audio.currentTime }
            })
        }
        const onEnded = () => {
            setAudioPlaybackState(prev => {
                return { ...prev, isPlaying: false, seekValue: 0, currentTime: 0 }
            })
        }
        const onResizeWindow = () => {
            setLargeScreen(window.innerWidth > 1200);
        }

        audio.addEventListener('loadeddata', onLoadedMetadata);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);
        window.addEventListener('resize', onResizeWindow);

        return () => {
            audio.removeEventListener('loadeddata', onLoadedMetadata);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
            window.removeEventListener('resize', onResizeWindow);
        }
    }, [])

    // to toggle awating and failed container
    const [toggleContainers, setToggleContainers] = useState('awaiting');
    const handleToggleContainer = (to) => {
        if (to === 'awaiting') {
            setToggleContainers('awaiting');

            setOpenedFailedTracks([]);

            handleToggleFailedOperationList('albums');

            resetSelectedAlbumFile();
            resetSelectedTrackFiles();
        } else {
            setToggleContainers('failed');

            setOpenedAwaitingAlbums([]);
            setOpenedAwaitingTracks([]);
        }
    }
    useEffect(() => {
        if (selectedAlbumFile || selectedTrackFiles) {
            handleToggleContainer('failed');
        }
    }, [selectedAlbumFile, selectedTrackFiles]);


    // updating and deleting related methods
    const [confirmationModalConfig, setConfirmationModalConfig] = useState({
        isHidden: true,
        title: '',
        message: '',
        onCancel: () => {
            setConfirmationModalConfig(prev => {
                return { ...prev, isHidden: true }
            })
        },
        onOk: () => { },
    });
    const [infoModalConfig, setInfoModalConfig] = useState({
        isHidden: true,
        title: 'Action Restricted: Processing in Progress',
        message: '',
        onOk: () => {
            setInfoModalConfig(prev => {
                return { ...prev, isHidden: true }
            })

            setTimeout(() => {
                setInfoModalConfig(prev => {
                    return { ...prev, message: '' }
                })
            }, 200);
        }
    });

    // to delete failed albums
    const handleAlbumDelete = (id, name) => {
        const title = 'Confirm Delete';
        const message = `Are you sure you want to delete "${name}" album?`;

        setConfirmationModalConfig(prev => {
            return {
                ...prev, isHidden: false,
                title, message,
                onOk: () => {
                    deleteAlbum(id)
                }
            }
        })
    }
    const deleteAlbum = async (id) => {
        try {
            setConfirmationModalConfig(prev => {
                return { ...prev, isHidden: true }
            })
            handleLoading(true);
            const res = await fetchWithAuth(`http://localhost:8080/api/albums/${id}`, {
                method: 'delete',
                credentials: 'include'
            })
            if (res.status >= 400) {
                throw new FetchWithAuthError(res, 'http error');
            }
            if (res.isRedirect) {
                return setTokenInfo({ isValidToken: true, message: res.message });
            }
            handleLoading(false);
            toast.success('Album deleted successfully.', toastOption);

            setConfirmationModalConfig(prev => {
                return { ...prev, title: '', message: '', onOk: () => { } }
            })

            const failedAlbums = [...processedUnpublishedAlbums.failed.albums]
            const index = failedAlbums.findIndex(album => album.id === id);
            if (index >= 0) {
                failedAlbums.splice(index, 1);
            }
            const newFailedAlbums = { failed: { ...processedUnpublishedAlbums.failed, albums: failedAlbums } };
            updateProcessedUnpublishedAlbum(newFailedAlbums);
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
                toast.error('Error occured while deleting album.', toastOption);
            }
            console.log(error);
            handleLoading(false);
        }
    }

    // to discard failed albums
    const handleAlbumDiscard = (id, name) => {
        const title = 'Confirm Discard';
        const message = `Are you sure you want to discard "${name}" album?`;

        setConfirmationModalConfig(prev => {
            return {
                ...prev, isHidden: false,
                title, message,
                onOk: () => {
                    discardAlbumUpdate(id)
                }
            }
        })
    }
    const discardAlbumUpdate = async (id) => {
        try {
            setConfirmationModalConfig(prev => {
                return { ...prev, isHidden: true }
            })
            const payload = {
                status: 'published',
                'cover.status': 'completed',
                'cover.error': null
            }
            const formData = new FormData();
            for (const key in payload) {
                formData.append(key, payload[key]);
            }

            handleLoading(true);
            const res = await fetchWithAuth(`http://localhost:8080/api/albums/${id}`, {
                method: 'PATCH',
                credentials: 'include',
                body: formData
            })
            if (res.status >= 400) {
                throw new FetchWithAuthError(res, 'http error');
            }
            if (res.isRedirect) {
                return setTokenInfo({ isValidToken: true, message: res.message });
            }
            handleLoading(false);
            toast.success('Album discarded successfully.', toastOption);

            setConfirmationModalConfig(prev => {
                return { ...prev, title: '', message: '', onOk: () => { } }
            })

            const failedAlbums = [...processedUnpublishedAlbums.failed.albums];
            const index = failedAlbums.findIndex(album => album.id === id);
            if (index >= 0) {
                failedAlbums.splice(index, 1);
            }
            const newFailedAlbums = { failed: { ...processedUnpublishedAlbums.failed, albums: failedAlbums } };
            updateProcessedUnpublishedAlbum(newFailedAlbums);

        } catch (error) {
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
                toast.error('Error occured while discarding album.', toastOption);
            }
            handleLoading(false);
            console.log(error);
        }
    }

    // to udpate failed albums
    const updateAlbum = async () => {
        try {
            if (!selectedAlbumFile) return;
            const { albumId, file } = selectedAlbumFile;

            const formData = new FormData();
            formData.append('albumImage', file);

            handleLoading(true);
            const res = await fetchWithAuth(`http://localhost:8080/api/albums/${albumId}`, {
                method: 'PATCH',
                credentials: 'include',
                body: formData
            });
            if (res.status >= 400) {
                throw new FetchWithAuthError(res, 'http error');
            }
            if (res.isRedirect) {
                return setTokenInfo({ isValidToken: true, message: res.message });
            }
            handleLoading(false);
            toast.success('Album updated successfully.', toastOption);

            resetSelectedAlbumFile();

            const albums = [...rawUnpublishedAlbums];
            const index = albums.findIndex((album) => album._id === albumId);
            if (index >= 0) {
                const newAlbum = { ...albums[index], ...res.data };
                albums.splice(index, 1);
                albums.unshift(newAlbum);
                updateRawUnpublishedAlbums(albums);
            }

        } catch (error) {
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
                toast.error('Error occured while updating album.', toastOption);
                console.log(error); 11
            }
            handleLoading(false);
            console.log(error);
        }
    }

    // to delete failed tracks
    const handleTrackDelete = (id, name, albumId) => {
        const albums = [...processedUnpublishedAlbums.pending, ...processedUnpublishedAlbums.processing];
        const album = albums.find(album => album.id === albumId)
        if (album && album.tracks.find(track => track.id === id)) {
            setInfoModalConfig(prev => {
                return { ...prev, isHidden: false, message: 'One or more processes for this track are still ongoing. Since processing is still active, the track cannot be deleted at this time. Please wait until all processes are complete.' }
            })
            return;
        }

        const title = 'Confirm Delete';
        const message = `Are you sure you want to delete "${name}" track?`;

        setConfirmationModalConfig(prev => {
            return {
                ...prev, isHidden: false,
                title, message,
                onOk: () => {
                    deleteTrack(id)
                }
            }
        })
    }
    const deleteTrack = async (id) => {
        try {
            setConfirmationModalConfig(prev => {
                return { ...prev, isHidden: true }
            })
            handleLoading(true);
            const res = await fetchWithAuth(`http://localhost:8080/api/tracks`, {
                method: 'delete',
                credentials: 'include',
                body: JSON.stringify({
                    trackIds: [id]
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (res.status >= 400) {
                throw new FetchWithAuthError(res, 'http error');
            }
            if (res.isRedirect) {
                return setTokenInfo({ isValidToken: true, message: res.message });
            }
            handleLoading(false);
            toast.success('Track deleted successfully.', toastOption);

            resetSelectedTrackFiles();
            setConfirmationModalConfig(prev => {
                return { ...prev, title: '', message: '', onOk: () => { } }
            })

            const failedTracks = [...processedUnpublishedAlbums.failed.tracks];
            const index = failedTracks.findIndex(track => track.id === id);
            if (index >= 0) {
                failedTracks.splice(index, 1);
            }
            const newFailedTracks = { failed: { ...processedUnpublishedAlbums.failed, tracks: failedTracks } };
            updateProcessedUnpublishedAlbum(newFailedTracks);

        } catch (error) {
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
                toast.error('Error occured while deleting track.', toastOption);
                console.log(error);
            }
            handleLoading(false);
            console.log(error)
        }
    }

    // to discard failed tracks
    const handleTrackDiscard = (id, name, albumId) => {
        const albums = [...processedUnpublishedAlbums.pending, ...processedUnpublishedAlbums.processing];
        const album = albums.find(album => album.id === albumId)
        if (album && album.tracks.find(track => track.id === id)) {
            setInfoModalConfig(prev => {
                return { ...prev, isHidden: false, message: 'One or more processes for this track are still ongoing. Since processing is still active, the track cannot be discarded at this time. Please wait until all processes are complete.' }
            })
            return;
        }

        const title = 'Confirm Discard';
        const message = `Are you sure you want to discard "${name}" track?`;

        setConfirmationModalConfig(prev => {
            return {
                ...prev, isHidden: false,
                title, message,
                onOk: () => {
                    discardTrackUpate(id)
                }
            }
        })
    }
    const discardTrackUpate = async (id) => {
        try {
            setConfirmationModalConfig(prev => {
                return { ...prev, isHidden: true }
            })
            const payload = {
                status: 'published',
                'cover.status': 'completed',
                'audio.status': 'completed',
                'cover.error': null,
                'audio.error': null,
            }
            const formData = new FormData();
            for (const key in payload) {
                formData.append(key, payload[key]);
            }

            handleLoading(true);
            const res = await fetchWithAuth(`http://localhost:8080/api/tracks/${id}`, {
                method: 'PATCH',
                credentials: 'include',
                body: formData
            });
            if (res.status >= 400) {
                throw new FetchWithAuthError(res, 'http error');
            }
            if (res.isRedirect) {
                return setTokenInfo({ isValidToken: true, message: res.message });
            }
            handleLoading(false);
            toast.success('Track discarded successfully.', toastOption);

            resetSelectedTrackFiles();
            setConfirmationModalConfig(prev => {
                return { ...prev, title: '', message: '', onOk: () => { } }
            })

            const failedTracks = [...processedUnpublishedAlbums.failed.tracks];
            const index = failedTracks.findIndex(track => track.id === id);
            if (index >= 0) {
                failedTracks.splice(index, 1);
            }
            const newFailedTracks = { failed: { ...processedUnpublishedAlbums.failed, tracks: failedTracks } };
            updateProcessedUnpublishedAlbum(newFailedTracks);
        } catch (error) {
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
                toast.error('Error occured while discarding track.', toastOption);
                console.log(error);
            }
            handleLoading(false);
            console.log(error);
        }
    }

    // to udpate failed tracks
    const updateTrack = async () => {
        try {
            if (!selectedTrackFiles) return;
            const { trackId, albumId } = selectedTrackFiles;

            const albums = [...processedUnpublishedAlbums.pending, ...processedUnpublishedAlbums.processing];
            const album = albums.find(album => album.id === albumId)
            if (album && album.tracks.find(track => track.id === id)) {
                setInfoModalConfig(prev => {
                    return { ...prev, isHidden: false, message: 'One or more processes for this track are still ongoing. Since processing is still active, the track cannot be updated at this time. Please wait until all processes are complete.' }
                })
                return;
            }
            const formData = new FormData();
            for (const key in selectedTrackFiles) {
                if (key === 'image') {
                    formData.append('trackImage', selectedTrackFiles[key].file);
                }
                else if (key === 'audio') {
                    formData.append('trackFile', selectedTrackFiles[key].file);
                }
            }

            handleLoading(true);
            const res = await fetchWithAuth(`http://localhost:8080/api/tracks/${trackId}`, {
                method: 'PATCH',
                credentials: 'include',
                body: formData
            });
            if (res.status >= 400) {
                throw new FetchWithAuthError(res, 'http error');
            }
            if (res.isRedirect) {
                return setTokenInfo({ isValidToken: true, message: res.message });
            }
            handleLoading(false);
            toast.success('Track updated successfully.', toastOption);
            resetSelectedTrackFiles();

            const rawAlbums = [...rawUnpublishedAlbums];
            const albumIndex = rawAlbums.findIndex(album => album._id === albumId);
            if (albumIndex >= 0) {
                const tracks = [...rawAlbums[albumIndex].unpublishedTracks];
                const trackIndex = tracks.findIndex(track => track._id === trackId);

                const newTrack = { ...tracks[trackIndex], ...res.data };
                tracks.splice(trackIndex, 1);
                tracks.unshift(newTrack);

                const newAlbum = { ...rawAlbums[albumIndex], unpublishedTracks: tracks };
                rawAlbums.splice(albumIndex, 1, newAlbum);

                updateRawUnpublishedAlbums(rawAlbums);
            }

        } catch (error) {
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
                toast.error('Error occured while updating track.', toastOption);
                console.log(error);
            }
            handleLoading(false);
            console.log(error);
        }
    }


    // context provider
    const contextValue = {
        // awaiting process realated contexts
        processedUnpublishedAlbums, toggleStatus, openedAwaitingAlbums, handleOpenAwaitingAlbum, resetSelectedAlbumFile, openedAwaitingTracks, handleOpenAwaitingTrack,

        // awaiting process realated contexts
        selectedAlbumFile, setSelectedAlbumFile, selectedTrackFiles, setSelectedTrackFiles, openedFailedTracks, handleOpenFailedTracks,

        // awaiting process realated contexts
        audioElementRef, setAudioPlaybackState, audioPlaybackState, handleAudioPlayPause, handleAudioSeek, resetSelectedTrackFiles, handleAlbumDelete, handleAlbumDiscard, updateAlbum, handleTrackDelete, handleTrackDiscard, updateTrack
    }

    return (
        <LayoutManagerContextProvider value={contextValue}>
            {
                isLargeScreen ?
                    <>
                        {/* // left part of the page (Awaiting action area) */}
                        <div className={style.AwaitingActionsContainer}>

                            {/* // Header of (Awaiting action area) */}
                            <div className={style.AwaitingActionsHeader}>

                                <div className={style.Summary}>
                                    <span>Result: {getTotalProcesses()}</span>
                                </div>
                                <div className={style.Controls}>
                                    <div className={style.RefreshContainer} onClick={fetchUnpublishedAlbums}>
                                        <span>Last refresh: {formatLastRefreshTime(lastRefreshTime)}</span>
                                        <span title='Refresh'><MdRefresh /></span>
                                    </div>
                                    <div className={style.ToggleBtns} onClick={handleToggleStatus}>
                                        <span className={`${toggleStatus === 'pending' ? style.SelectedToggleBtn : ''}`} title='Pending'><FaStop /></span>
                                        <span className={`${toggleStatus === 'processing' ? style.SelectedToggleBtn : ''}`} title='Processing'><FaPlay /></span>
                                    </div>
                                </div>

                            </div>

                            {/* // --------------- row-divider --------------- // */}
                            <div className={style.HorizontalDivider} />

                            {/* // body of (Awaiting action area) */}
                            <div className={style.AwaitingActionsBody}>
                                <NodeContainer />
                            </div>

                        </div>

                        {/* // --------------- collumn-divider --------------- // */}
                        <div className={style.VerticalDivider} />

                        {/* // right part of the page (Failed action area) */}
                        <div className={style.FailedActionsContainer}>
                            <div className={style.FailedActionsHeader}>
                                <h2>Failed Operations</h2>
                                <div className={style.Controls}>
                                    <span
                                        onClick={() => handleToggleFailedOperationList('albums')}
                                        style={{ borderColor: toggleFailedOperationList === 'albums' ? 'var(--midnight-shade-1)' : 'transparent' }}
                                    >Albums</span>
                                    <span
                                        onClick={() => handleToggleFailedOperationList('tracks')}
                                        style={{ borderColor: toggleFailedOperationList === 'tracks' ? 'var(--midnight-shade-1)' : 'transparent' }}
                                    >Tracks</span>
                                </div>
                            </div>

                            {/* // --------------- collumn-divider --------------- // */}
                            <div className={style.HorizontalDivider} />

                            <div className={style.FailedActionsBody}>
                                {
                                    toggleFailedOperationList === 'albums' ?
                                        <FailedAlbums />
                                        :
                                        <FailedTracks />
                                }
                            </div>
                        </div>
                    </>
                    :
                    <>
                        <div className={style.ContainerWrapperHeader}>
                            <span
                                style={{ color: toggleContainers === 'awaiting' ? `var(--midnight-shade-2)` : '' }}
                                onClick={() => handleToggleContainer('awaiting')}
                            >Active uploads</span>

                            <span>|</span>

                            <span
                                style={{ color: toggleContainers === 'failed' ? `var(--midnight-shade-2)` : '' }}
                                onClick={() => handleToggleContainer('failed')}
                            >Failed uploads</span>
                        </div>
                        {
                            toggleContainers === 'awaiting' ?
                                <div className={style.AwaitingActionsContainer}>

                                    {/* // Header of (Awaiting action area) */}
                                    <div className={style.AwaitingActionsHeader}>

                                        <div className={style.Summary}>
                                            <span>Result: {getTotalProcesses()}</span>
                                        </div>
                                        <div className={style.Controls}>
                                            <div className={style.RefreshContainer} onClick={fetchUnpublishedAlbums}>
                                                <span>Last refresh: {formatLastRefreshTime(lastRefreshTime)}</span>
                                                <span title='Refresh'><MdRefresh /></span>
                                            </div>
                                            <div className={style.ToggleBtns} onClick={handleToggleStatus}>
                                                <span className={`${toggleStatus === 'pending' ? style.SelectedToggleBtn : ''}`} title='Pending'><FaStop /></span>
                                                <span className={`${toggleStatus === 'processing' ? style.SelectedToggleBtn : ''}`} title='Processing'><FaPlay /></span>
                                            </div>
                                        </div>

                                    </div>

                                    {/* // --------------- row-divider --------------- // */}
                                    <div className={style.HorizontalDivider} />

                                    {/* // body of (Awaiting action area) */}
                                    <div className={style.AwaitingActionsBody}>
                                        <NodeContainer />
                                    </div>

                                </div>
                                :
                                <div className={style.FailedActionsContainer}>
                                    <div className={style.FailedActionsHeader}>
                                        <h2>Failed Operations</h2>
                                        <div className={style.Controls}>
                                            <span
                                                onClick={() => handleToggleFailedOperationList('albums')}
                                                style={{ borderColor: toggleFailedOperationList === 'albums' ? 'var(--midnight-shade-1)' : 'transparent' }}
                                            >Albums</span>
                                            <span
                                                onClick={() => handleToggleFailedOperationList('tracks')}
                                                style={{ borderColor: toggleFailedOperationList === 'tracks' ? 'var(--midnight-shade-1)' : 'transparent' }}
                                            >Tracks</span>
                                        </div>
                                    </div>

                                    {/* // --------------- collumn-divider --------------- // */}
                                    <div className={style.HorizontalDivider} />

                                    <div className={style.FailedActionsBody}>
                                        {
                                            toggleFailedOperationList === 'albums' ?
                                                <FailedAlbums />
                                                :
                                                <FailedTracks />
                                        }
                                    </div>
                                </div>
                        }

                    </>
            }
            <div className={`${style.ModalWrapper} ${!confirmationModalConfig.isHidden ? style.ShowModal : ''}`}>
                <div className={style.Modal}>
                    <h2>{confirmationModalConfig.title}</h2>
                    <p>{confirmationModalConfig.message}</p>
                    <div className={style.ModalBtn}>
                        <span onClick={confirmationModalConfig.onCancel}>Cancel</span>
                        <span onClick={confirmationModalConfig.onOk}>Ok</span>
                    </div>
                </div>
            </div>

            <div className={`${style.ModalWrapper} ${!infoModalConfig.isHidden ? style.ShowModal : ''}`}>
                <div className={style.Modal}>
                    <h2>{infoModalConfig.title}</h2>
                    <p>{infoModalConfig.message}</p>
                    <div className={style.ModalBtn}>
                        <span onClick={infoModalConfig.onOk}>Ok</span>
                    </div>
                </div>
            </div>
        </LayoutManagerContextProvider >
    )

}

export default LayoutManager;