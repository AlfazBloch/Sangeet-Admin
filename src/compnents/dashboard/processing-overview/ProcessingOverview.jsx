import { useEffect, useRef, useState } from 'react';
import { useMasterLayout } from '../layout.context';

import style from './style.module.css';
import utilstyle from '../../util.module.css';

import InitSrcLoader from '../reusable/InitSrcLoader.jsx';

import { fetchWithAuth, FetchWithAuthError, BsInfoCircle, IoClose, collections } from '../../../utility.js';
import WavyPreloader from '../../loaders/WavyPreloader.jsx';
import LayoutManager from './LayoutManager.jsx';

function ProcessingOverview() {
    const { setTokenInfo, setInitSrcError, socketMessage } = useMasterLayout();

    const [rawUnpublishedAlbums, setRawUnpublishedAlbums] = useState([]);
    const [processedUnpublishedAlbums, setProcessedUnpublishedAlbums] = useState({
        pending: [], processing: [], failed: {
            albums: [],
            tracks: []
        }
    });

    const [isInitSrcLoaded, setInitSrcLoaded] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState(0);
    const [isLoading, setLoading] = useState(false);
    const [isPageInfoPopupHidden, setPageInfoPopupHidden] = useState(true);

    const pageInfoPopupRef = useRef();
    const refreshTimeIntervalRef = useRef();

    const handleLoading = (boolVal) => {
        setLoading(boolVal);
    }
    const handleTogglePageInfoPop = (e) => {
        e.stopPropagation();
        setPageInfoPopupHidden(prev => !prev);
    }
    const formatLastRefreshTime = (min = 0) => {
        if (min === 0) {
            return `< 1 min`;
        }
        else if (min >= 60) {
            const hour = Math.floor(min / 60);

            if (hour >= 60) {
                return `${Math.floor(hour / 24)} day`;
            }
            return `${hour} hour`;
        }
        return `${min} min`;
    }
    const fetchUnpublishedAlbums = async () => {
        try {
            handleLoading(true);
            const res = await fetchWithAuth(`http://localhost:8080/api/albums/unpublished?t=${Date.now()}`, {
                method: 'get',
                credentials: 'include'
            });

            if (res.status >= 400) {
                throw new FetchWithAuthError(res, 'http error');
            }
            if (res.isRedirect) {
                return setTokenInfo({ isValidToken: false, message: res.message });
            }
            if (refreshTimeIntervalRef.current) {
                clearInterval(refreshTimeIntervalRef.current);
            }
            refreshTimeIntervalRef.current = setInterval(() => {
                setLastRefreshTime(prev => prev + 1);
            }, 1000 * 60);

            setLastRefreshTime(0);
            handleLoading(false);
            setInitSrcLoaded(true);
            setRawUnpublishedAlbums(res.data);
        }
        catch (error) {
            console.log(error);
            if (!isInitSrcLoaded) {
                throw error;
            }
            handleLoading(false);
        }
    }
    const updateProcessedUnpublishedAlbum = (data) => {
        setProcessedUnpublishedAlbums(prev => {
            return {
                ...prev, ...data
            }
        })
    }
    const updateRawUnpublishedAlbums = (data) => {
        setRawUnpublishedAlbums(data);
    }

    useEffect(() => {
        const loadInitSrc = async () => {
            try {
                await fetchUnpublishedAlbums();
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
        loadInitSrc();
    }, []);
    useEffect(() => {
        const status = {
            PENDING: 'pending',
            PROCESSING: 'processing',
            FAILED: 'failed'
        }
        const color = {
            pending: 'var(--pending-yellow)',
            processing: 'var(--processing-blue)'
        }
        const handleCoverStatus = ({ obj, data, processesStatus = [], failedAlbumsOrTracks, onActive, onFailed = () => ({}) }) => {
            const { id, name, cover } = data;

            if (cover.status === status.PENDING || cover.status === status.PROCESSING) {
                obj.processes.push({
                    status: cover.status,
                    operation: 'Image operation',
                    statusColor: color[cover.status]
                })
                processesStatus.forEach(ele => ele.push(cover.status));
                onActive();
            }
            else if (cover.status === status.FAILED) {
                failedAlbumsOrTracks.push({
                    id, name,
                    action: cover.name ? 'update' : 'create',
                    processes: [{ type: 'image', operation: 'Image operation' }],
                    ...onFailed()
                });
            }
        }
        const handleAudioAndCoverStatus = ({ obj, data, processesStatus = [], failedAlbumsOrTracks, onActive, onFailed = () => ({}) }) => {
            handleCoverStatus({ obj, data, processesStatus, failedAlbumsOrTracks, onActive, onFailed });
            const { id, name, audio } = data;

            if (audio.status === status.PENDING || audio.status === status.PROCESSING) {
                obj.processes.push({
                    status: audio.status,
                    operation: 'Audio operation',
                    statusColor: color[audio.status]
                })
                processesStatus.forEach(ele => ele.push(audio.status));
                onActive();
            }
            else if (audio.status === status.FAILED) {
                const failedTrack = failedAlbumsOrTracks.find(track => track.id === id);
                const audioProcess = { type: 'audio', operation: 'Audio operation' };
                if (failedTrack) {
                    failedTrack.processes.push(audioProcess);
                }
                else {
                    failedAlbumsOrTracks.push({
                        id, name,
                        action: audio.name ? 'update' : 'create',
                        processes: [audioProcess],
                        ...onFailed()
                    });
                }
            }
        }

        const pendingAlbums = [];
        const processingAlbums = [];
        const failedAlbumsAndTracks = {
            albums: [],
            tracks: [],
        };

        rawUnpublishedAlbums.forEach(unpublishedAlbum => {
            const { _id, title, cover, unpublishedTracks } = unpublishedAlbum;
            const album = {
                totalProcesses: 0,
                processes: [],
                tracks: []
            }
            const albumProcessesStatus = [];
            handleCoverStatus({
                obj: album, data: { id: _id, name: title, cover }, processesStatus: [albumProcessesStatus], failedAlbumsOrTracks: failedAlbumsAndTracks.albums, onActive: () => {
                    album.totalProcesses += 1;
                }
            });

            unpublishedTracks.forEach(unpublishedTrack => {
                const { _id, name, cover, audio } = unpublishedTrack;
                const track = {
                    totalProcesses: 0,
                    processes: [],
                }
                const trackProcessesStatus = [];
                handleAudioAndCoverStatus({
                    obj: track, data: { id: _id, name, cover, audio }, processesStatus: [albumProcessesStatus, trackProcessesStatus],
                    failedAlbumsOrTracks: failedAlbumsAndTracks.tracks,
                    onActive: () => {
                        album.totalProcesses += 1;
                        track.totalProcesses += 1;
                    },
                    onFailed: () => {
                        return { albumId: unpublishedAlbum._id }
                    }
                });

                if (track.totalProcesses > 0) {
                    track.id = _id;
                    track.name = name;
                    const isTrackProcessing = trackProcessesStatus.some(ele => ele === status.PROCESSING);
                    track.status = isTrackProcessing ? status.PROCESSING : status.PENDING;
                    track.statusColor = color[track.status];
                    album.tracks.push(track);
                }
            })

            if (album.totalProcesses > 0) {
                album.id = _id;
                album.name = title;
                const isAlbumProcessing = albumProcessesStatus.some(ele => ele === status.PROCESSING);
                if (isAlbumProcessing) {
                    album.status = status.PROCESSING;
                    album.statusColor = color[album.status];
                    processingAlbums.push(album);
                }
                else {
                    album.status = status.PENDING;
                    album.statusColor = color[album.status];
                    pendingAlbums.push(album);
                }
            }
        })

        const splitFailedAlbums = failedAlbumsAndTracks.albums.reduce((accum, failedAlbum) => {
            if (failedAlbum.action === 'create') {
                accum[0].push(failedAlbum);
            }
            else {
                accum[1].push(failedAlbum);
            }
            return accum;
        }, [[], []]);

        const splitFailedTracks = failedAlbumsAndTracks.tracks.reduce((accum, failedTrack) => {
            if (failedTrack.action === 'create') {
                accum[0].push(failedTrack);
            }
            else {
                accum[1].push(failedTrack);
            }
            return accum;
        }, [[], []]);

        setProcessedUnpublishedAlbums({
            pending: pendingAlbums, processing: processingAlbums, failed: {
                albums: [...splitFailedAlbums[0], ...splitFailedAlbums[1]],
                tracks: [...splitFailedTracks[0], ...splitFailedTracks[1]]
            }
        })

    }, [rawUnpublishedAlbums]);
    useEffect(() => {
        if (!isPageInfoPopupHidden) {
            const handleHidePageInfoPopup = (e) => {
                if (pageInfoPopupRef.current && !pageInfoPopupRef.current.contains(e.target)) {
                    setPageInfoPopupHidden(true);
                }
            }

            document.addEventListener('click', handleHidePageInfoPopup);

            return () => {
                document.removeEventListener('click', handleHidePageInfoPopup);
            }
        }
    }, [isPageInfoPopupHidden]);
    useEffect(() => {
        if (!socketMessage) return;
        console.log(socketMessage)

        const { data, collection } = socketMessage;
        let rawAlbums = [...rawUnpublishedAlbums];
        if (collection === collections.ALBUMS) {
            const index = rawAlbums.findIndex(ele => ele._id === data.id);
            if (index >= 0) {
                rawAlbums.splice(index, 1, { ...rawAlbums[index], ...data });
            }
        }
        else if (collection === collections.TRACKS) {
            const albumIndex = rawAlbums.findIndex((ele) => {
                return !!ele.unpublishedTracks.find(track => track._id === data.id)
            });
            if (albumIndex >= 0) {
                let rawTracks = [...rawAlbums[albumIndex].unpublishedTracks];
                const trackIndex = rawTracks.findIndex(ele => ele._id === data.id);
                if (trackIndex >= 0) {
                    rawTracks.splice(trackIndex, 1, { ...rawTracks[trackIndex], ...data })
                    rawAlbums[albumIndex].unpublishedTracks = rawTracks;
                }
            }
        }
        setRawUnpublishedAlbums(rawAlbums);
    }, [socketMessage])

    return (
        <>
            {
                isInitSrcLoaded ?
                    <div className={style.ProcessingOverview}>

                        <div className={style.Header}>
                            <h1>Processing Insights</h1>
                            <div className={style.PageInfoContainer}>
                                <BsInfoCircle onClick={handleTogglePageInfoPop} />

                                <div className={`${style.Information} ${!isPageInfoPopupHidden ? style.ShowModal : ''}`} ref={pageInfoPopupRef}>
                                    <h2>About Processing Overview</h2>
                                    <p>This is your Processing Overview dashboard, where you manage background tasks for tracks and albums.</p>

                                    <div className={style.InfoList}>
                                        <h3>Pending/Processing Operations (Left):</h3>
                                        <p>Shows uploads being optimized (e.g., audio encoding, image resizing) or waiting in the queue.</p>
                                    </div>
                                    <div className={style.InfoList}>
                                        <h3>Failed Operations (Right):</h3>
                                        <p>Lists tasks that encountered errors. Here's how to resolve them:</p>
                                        <div className={style.ListItem}>
                                            <h3>For updates (e.g., replacing audio/image):</h3>
                                            <p><b>1) Discard</b>: Undo the media changes (audio/image revert to their previous versions) and republish the track/album to your profile. Other details (like name) remain unchanged.</p>
                                            <p><b>2) Reupload</b>: Fix the issue by uploading corrected media files.</p>
                                        </div>
                                        <div className={style.ListItem}>
                                            <h3>For new uploads (e.g., fresh tracks/albums):</h3>
                                            <p><b>1) Delete</b>: Remove the incomplete entry entirely. This action is permanent.</p>
                                        </div>
                                    </div>

                                    <div className={style.InfoList}>
                                        <h3>Note:</h3>
                                        <p>- Discarded/updated items will reappear on your profile once processing succeeds.</p>
                                        <p>- The page auto-refreshes periodically (last refresh: {formatLastRefreshTime(lastRefreshTime)} ago).</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`${style.ModalWrapper} ${!isPageInfoPopupHidden ? style.ShowModal : ''}`}>
                                <div className={`${style.Information} ${style.ShowModal}`}>
                                    <div className={style.CloseBtn}><IoClose /></div>
                                    <h2>About Processing Overview</h2>
                                    <p>This is your Processing Overview dashboard, where you manage background tasks for tracks and albums.</p>

                                    <div className={style.InfoList}>
                                        <h3>Pending/Processing Operations (Left):</h3>
                                        <p>Shows uploads being optimized (e.g., audio encoding, image resizing) or waiting in the queue.</p>
                                    </div>
                                    <div className={style.InfoList}>
                                        <h3>Failed Operations (Right):</h3>
                                        <p>Lists tasks that encountered errors. Here's how to resolve them:</p>
                                        <div className={style.ListItem}>
                                            <h3>For updates (e.g., replacing audio/image):</h3>
                                            <p><b>1) Discard</b>: Undo the media changes (audio/image revert to their previous versions) and republish the track/album to your profile. Other details (like name) remain unchanged.</p>
                                            <p><b>2) Reupload</b>: Fix the issue by uploading corrected media files.</p>
                                        </div>
                                        <div className={style.ListItem}>
                                            <h3>For new uploads (e.g., fresh tracks/albums):</h3>
                                            <p><b>1) Delete</b>: Remove the incomplete entry entirely. This action is permanent.</p>
                                        </div>
                                    </div>

                                    <div className={style.InfoList}>
                                        <h3>Note:</h3>
                                        <p>- Discarded/updated items will reappear on your profile once processing succeeds.</p>
                                        <p>- The page auto-refreshes periodically (last refresh: {formatLastRefreshTime(lastRefreshTime)} ago).</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={style.ContainerWrapper}>
                            <LayoutManager

                                handleLoading={handleLoading}

                                lastRefreshTime={lastRefreshTime}
                                formatLastRefreshTime={formatLastRefreshTime}

                                fetchUnpublishedAlbums={fetchUnpublishedAlbums}

                                processedUnpublishedAlbums={processedUnpublishedAlbums}
                                updateProcessedUnpublishedAlbum={updateProcessedUnpublishedAlbum}

                                rawUnpublishedAlbums={rawUnpublishedAlbums}
                                updateRawUnpublishedAlbums={updateRawUnpublishedAlbums}
                            />
                        </div>

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

export default ProcessingOverview
