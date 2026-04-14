import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { debounce } from 'lodash';

import style from './style.module.css';
import utilStyle from '../../util.module.css';

import { useMasterLayout } from '../layout.context';
import { FiTrash2, BiSolidEdit, AiOutlineLike, HiSpeakerWave, HiSpeakerXMark, MdOutlineSettingsSuggest, IoInfinite, TbRepeat, TbRepeatOnce, toastOption, IoMdEye, MdSkipPrevious, MdSkipNext, IoPlay, IoPause, FaHeadphones, IoTime, MdFavorite, BsFillCalendarDayFill, MdAudiotrack, FaHistory, IoFilter, GoSearch, HiSortAscending, HiSortDescending, fetchWithAuth, IoClose, FetchWithAuthError, formatTime, convertTimeToMinSec } from '../../../utility';
import { resultsNotFound } from '../../../assets/index';
import InputRange from '../reusable/InputRange.jsx';
import EditAlbumOverlay from './EditAlbumOverlay.jsx';

import LazyLoader1 from '../../loaders/LazyLoader1.jsx';
import InitSrcLoader from '../reusable/InitSrcLoader';
import BouncyLoader from '../../loaders/BouncyLoader.jsx';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../../app.css';



function Albums() {
    // --------------------------------hooks---------------------------------------------
    const {
        // states 
        isAlbumProcessing, albums, updatedTrackData, updatedAlbumData, setDiscardPopupHidden, setDiscardPopupConfig, isAlbumEditOverlayHidden,
        isAudioLoaded, soundLevel, audioSettings, isPlaying, currentTime, audioDuration, audioSeekbarValue, isSidebarExpanded, isPlaybarExp,

        // setters
        setAlbums, setAlbumEditOverlayHidden,
        setInitSrcError, setMobileAlbumSidebarSkeletonLoading, setSidebarExpanded, setPlaybarExp, setMobileSidebarExp, selectedTrack, setSelectedTrack, setExtractedColor, selectedAlbum, setSelectedAlbum, setTokenInfo,

        // methods
        resetAlbumAndTrackChanges, resetPlayer, handleSoundMute, handleSoundlevel, extractedColor, onSeeking, onSeekEnd, navigateTo, togglePlayPause, handleTrackClick, closeALbumSidebar, changeAudioSetting, onDeleteAlbumBtnClick,
    } = useMasterLayout();

    const [sortType, setSortType] = useState('');
    const [genreFilters, setGenreFilters] = useState([]);
    const [isOrderByDate, setOrderByDate] = useState(false);
    const [pageCount, setPageCount] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const [showFilter, setShowFilter] = useState(false);

    const [isSuggestedResult, setSuggestedResult] = useState(false);
    const [suggestionList, setSuggestionList] = useState([]);

    const [searchString, setSearchString] = useState('');
    const [isSearched, setSearched] = useState(false);

    const [genres, setGenres] = useState([]);

    const [isTrackTitleOverflow, setTrackTitleOverflow] = useState(false);

    const [isLoading, setLoading] = useState(false);
    const [isSkeletonLoading, setSkeletonLoading] = useState(false);
    const [isSkeletonSuggestionLoading, setSkeletonSuggestionLoading] = useState(false);
    const [isInitSrcLoaded, setInitSrcLoaded] = useState(false);

    const [isSuggestionBoxExp, setSuggestionBoxExp] = useState(false);

    const [isAudioSetttingsHidden, setAudioSettingsHidden] = useState(true);
    const [isLikeCountHidden, setLikeCountHidden] = useState(true);
    const [isSoundControlHidden, setSoundControlHidden] = useState(true);

    const [audioSettingTimeoutId, setAudioSettingTimeoutId] = useState(0);
    const [soundControlTimeoutId, setSoundControlTimeoutId] = useState(null);

    const [triggerAudioSettingKey, setTriggerAudioSettingKey] = useState(0);

    const observer = useRef();                                              // to observe last albumelem                                
    const trackTitleRef = useRef(null);                                     //to keep ref of track title
    const albumsControllerRef = useRef();                                   //for abort controller


    // --------------------------------- edit album related states --------------------------------------------------

    const [isAlbumEditBtnHidden, setAlbumEditBtnHidden] = useState(true);

    // --------------------------------- mothods and callbacks --------------------------------------------------

    const lastAlbumRef = useCallback(node => {                      // -------------------------Obeserver implementation -----------------------
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPageCount((prev) => prev + 1);
            }
        })
        if (node) {
            observer.current.observe(node);
        }
    }, [isLoading, hasMore]);

    const handleSuggestionHistory = (suggestion) => {                // -----------FOR SEARCH AND FILTER and Lazy loading------------------
        if (!suggestion || !suggestion.trim()) return;
        const searchHistory = JSON.parse(localStorage.getItem('searchHistory'));
        const findHistory = (history) => {
            return history.title.toLowerCase() === suggestion.toLowerCase();
        }
        if (searchHistory.find(findHistory)) {
            const index = searchHistory.findIndex(findHistory);
            if (index < 0) return;
            searchHistory.splice(index, 1);
            searchHistory.unshift({ title: suggestion, fromHistory: true });
            localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
            return;
        }
        if (searchHistory.length >= 18) {
            searchHistory.pop();
            return;
        }
        searchHistory.unshift({ title: suggestion, fromHistory: true });
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }

    const handleGenreFilters = (id) => {
        const allGenreFilters = [...genreFilters];
        if (genreFilters.includes(id)) {
            const index = allGenreFilters.indexOf(id);
            allGenreFilters.splice(index, 1);
            setGenreFilters(allGenreFilters);
        }
        else {
            allGenreFilters.push(id);
            setGenreFilters(allGenreFilters);
        }
        setPageCount(1);
        setAlbums([]);
    }

    const fetchSuggestions = async (query) => {
        try {
            setSkeletonSuggestionLoading(true);
            setSuggestionBoxExp(true);
            const res = await fetchWithAuth(`http://localhost:8080/api/albums/suggestion?search=${query}&&limit=${6}`, {
                method: 'get',
                credentials: 'include'
            });
            if (res.status >= 400) {
                throw new FetchWithAuthError();
            }
            if (res.isRedirect) {
                const message = res.message;
                setTokenInfo({ isValidToken: false, message })
                return;
            }
            setSuggestionList(res.data);
            setSkeletonSuggestionLoading(false);
        }
        catch (error) {
            setSuggestionBoxExp(false);
            setSkeletonSuggestionLoading(false);
            console.log(error);
        }
    }

    const fetchAlbums = useCallback(async (query) => {
        try {
            if (albumsControllerRef.current) albumsControllerRef.current.abort();
            albumsControllerRef.current = new AbortController();
            setLoading(true);
            const albumData = await fetchWithAuth(`http://localhost:8080/api/albums/published?search=${query}&&page=${pageCount}&&limit=2&&sort=${sortType}&&genres=${JSON.stringify(genreFilters)}&&order_by_date=${isOrderByDate}`, {
                method: 'get',
                credentials: 'include',
                signal: albumsControllerRef.current.signal
            });
            if (albumData.status >= 400) {
                throw new FetchWithAuthError(albumData, 'http error');
            }
            if (albumData.isRedirect) {
                const message = albumData.message;
                setTokenInfo({ isValidToken: false, message });
                return;
            }
            setAlbums((prev) => {
                return [...new Set([...prev, ...albumData.data.albums])];
            });
            setHasMore(!(pageCount === albumData.data.totalPages));
            setLoading(false);
        }
        catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request aborted: ', error);
                return;
            }
            else if (error.name === 'TypeError') {
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
                toast.error('Error occured while fetching albums', toastOption);
                console.log(error);
            }
            setLoading(false);
        }
    }, [searchString, pageCount, genreFilters, sortType, isOrderByDate]);

    const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), []);

    const onSearchInputChange = async (e) => {
        if (isSearched) setSearched(false);
        if (isSuggestedResult) setSuggestedResult(false);
        setSearchString(e.target.value);
        debouncedFetchSuggestions(e.target.value);
    }
    const handleSuggestionClick = (query) => {
        setSuggestionList([]);
        setSuggestedResult(true);
        setSearchString(query);
        handleSuggestionHistory(query);
        setSearched(true);
        setAlbums([]);
        setPageCount(1);
        fetchAlbums(`"${query}"`);
    }

    const handleSearchBtnClick = () => {
        if (!isSuggestedResult) {
            if (searchString) {
                setSearched(true);
            }
            setSuggestionList([]);
            handleSuggestionHistory(searchString);
            setAlbums([]);
            setPageCount(1);
            fetchAlbums(searchString);
        }
    }

    const handleClearSearchAndResetAlbumResults = async () => {
        setSearched(false);
        setSearchString('');
        setAlbums([]);
        if (isSuggestedResult) setSuggestedResult(false);
        setPageCount(1);
        fetchAlbums('');
    }

    // -----------------------------------  for sidebar ----------------------------------------
    const handleAlbumClick = (id) => {
        if (isAlbumProcessing) {
            toast.info("Hold on! We're still updating your album. Once it's all set, you can pick a new one!", toastOption);
            return;
        }
        if (selectedAlbum && id === selectedAlbum._id) {
            setMobileSidebarExp(true);
        }
        else if (Object.keys(updatedAlbumData).length > 0 || Object.keys(updatedTrackData).length > 0) {
            setDiscardPopupHidden(false);
            setDiscardPopupConfig(prev => {
                return {
                    ...prev,
                    onDiscard: () => {
                        fetchPopulatedAlbum(id);
                    }
                }
            })
        }
        else {
            fetchPopulatedAlbum(id);
        }
    }
    const fetchPopulatedAlbum = async (id) => {
        try {

            //reseting everything
            resetAlbumAndTrackChanges();
            resetPlayer();
            setMobileSidebarExp(true);
            if (selectedTrack) setSelectedTrack(null);
            if (selectedAlbum) setSelectedAlbum(null);
            if (isPlaybarExp) setPlaybarExp(false);
            setSidebarExpanded(true);

            setSkeletonLoading(true);
            setMobileAlbumSidebarSkeletonLoading(true);

            //execution
            const albumData = await fetchWithAuth(`http://localhost:8080/api/albums/${id}?for_populate=true`, {
                method: 'get',
                credentials: 'include'
            })
            if (albumData.status >= 400) {
                throw new FetchWithAuthError(albumData, 'http error');
            }
            if (albumData.isRedirect) {
                const message = albumData.message;
                setTokenInfo({ isValidToken: false, message })
                return;
            }

            let albumDuration = 0;
            for (let i = 0; i < albumData.data.track.length; i++) {

                let formattedTitle = albumData.data.track[i].name;
                if (albumData.data.track[i].featuredArtists.length > 0) {
                    formattedTitle += ' ft. ' + albumData.data.track[i].featuredArtists.join(', ');
                }

                const formattedDuration = formatTime(albumData.data.track[i].duration);
                albumData.data.track[i] = { ...albumData.data.track[i], formattedDuration, formattedTitle };

                albumDuration += albumData.data.track[i].duration;
            }
            setSelectedAlbum({ ...albumData.data, albumDuration });
            setSkeletonLoading(false);
            setMobileAlbumSidebarSkeletonLoading(false);
        }
        catch (error) {
            if (error.name === 'TypeError') {
                toast.error('Network error: Please check your internet connection.', toastOption);
            }
            else if (error instanceof FetchWithAuthError) {
                let message = '';
                let errors = error.errorObj.data.errors;
                for (const key in errors) {
                    message = errors[key].message;
                }
                toast.error(message, toastOption);
            }
            else {
                console.log(error);
                toast.error('Error occured while fetching albums', toastOption);
            }
            setSkeletonLoading(false);
            setSidebarExpanded(false);
            setMobileSidebarExp(false);
            setMobileAlbumSidebarSkeletonLoading(false);
            setSelectedAlbum(null);
            console.log(error)
        }
    }
    const handleAudioSettingHover = () => {
        setTriggerAudioSettingKey(prev => prev + 1);
        if (isAudioSetttingsHidden) {
            setAudioSettingsHidden(false);
        }
    }
    const handleAudioSettingClick = (key) => {
        setTriggerAudioSettingKey(prev => prev + 1);
        if (isAudioSetttingsHidden) {
            setAudioSettingsHidden(false);
        }
        changeAudioSetting(key);
    }
    const handleSoundControlVisibility = () => {
        if (soundControlTimeoutId) {
            clearTimeout(soundControlTimeoutId)
        };
        setSoundControlHidden(false);
    }
    const handleSoundControlInvisibility = () => {
        const id = setTimeout(() => {
            setSoundControlHidden(true);
        }, 5000);
        setSoundControlTimeoutId(id);
    }


    // ----------useEffects 
    useEffect(() => {           // ----------for initial fetching ------------------
        const fetchInitResource = async () => {
            try {
                const genreData = await fetchWithAuth('http://localhost:8080/api/genres', {
                    method: 'get',
                    credentials: 'include'
                })
                if (genreData.status >= 400) {
                    throw new FetchWithAuthError('http error', genreData);
                }
                if (genreData.isRedirect) {
                    const message = genreData.message;
                    setTokenInfo({ isValidToken: false, message });
                    return;
                }
                setGenres(genreData.data);
                setInitSrcLoaded(true);
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
        fetchInitResource();
        setAlbums([]);
        if (!localStorage.getItem('searchHistory')) {
            localStorage.setItem('searchHistory', JSON.stringify([]));
        }
    }, [])

    useEffect(() => {           // ----------for search & filters ------------------
        fetchAlbums(isSuggestedResult ? `"${searchString}"` : searchString);
    }, [pageCount, genreFilters, sortType, isOrderByDate]);

    useEffect(() => {           // ----------for marquee effect --------------------
        if (trackTitleRef.current) {
            const resizeObserver = new ResizeObserver(() => {
                if (!trackTitleRef.current) {
                    return;
                }
                if (trackTitleRef.current.scrollWidth > trackTitleRef.current.clientWidth) {
                    setTrackTitleOverflow(true);
                }
                else {
                    setTrackTitleOverflow(false);
                }
            })
            resizeObserver.observe(trackTitleRef.current)
            return () => {
                resizeObserver.disconnect();
            }
        }
    }, [selectedTrack]);

    useEffect(() => {           // ----------for audio plabaar appeareance ---------
        if (triggerAudioSettingKey === 0) return;
        if (audioSettingTimeoutId) {
            clearTimeout(audioSettingTimeoutId);
        }
        const id = setTimeout(() => {
            setAudioSettingsHidden(true);
        }, 4000);
        setAudioSettingTimeoutId(id);
    }, [triggerAudioSettingKey]);

    return (
        <>
            {isInitSrcLoaded ?
                <div className={style.MainSection}>

                    {/* -------------------------------- left side ----------------------------------- */}
                    <div className={style.AlbumWrapper}>
                        <div className={style.Header} >
                            <h1>Albums</h1>
                            <div className={style.SearchNFilter}>
                                <div className={style.Searchbar}>
                                    <input
                                        type="text"
                                        placeholder='Discover albums...'
                                        onChange={onSearchInputChange}
                                        value={searchString}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearchBtnClick();
                                            }
                                        }}
                                        onFocus={() => {
                                            const searchHistory = JSON.parse(localStorage.getItem('searchHistory'));
                                            if (searchHistory) {
                                                setSuggestionBoxExp(true);
                                                setSuggestionList(searchHistory);
                                                if (showFilter) setShowFilter(false);
                                            }
                                        }}
                                        onBlur={() => {
                                            setSuggestionList([]);
                                            setSuggestionBoxExp(false);
                                        }}
                                    />
                                    {isSearched ? <IoClose onClick={handleClearSearchAndResetAlbumResults} /> : <GoSearch onClick={handleSearchBtnClick} />}
                                </div>
                                <div
                                    className={`${style.SuggestionBox} ${(isSuggestionBoxExp && suggestionList.length > 0) || isSkeletonSuggestionLoading ? utilStyle.ShowFlex : utilStyle.Hide}`}
                                    onMouseDown={e => e.preventDefault()}
                                    style={{ height: `${isSkeletonSuggestionLoading ? "240.1px" : "unset"}` }}
                                >
                                    <div className={style.Divider} />
                                    <div className={style.SuggestionList}>
                                        {
                                            suggestionList.map((suggestion, index) => {
                                                return (
                                                    <span
                                                        key={index}
                                                        onClick={() => {
                                                            handleSuggestionClick(suggestion.title);
                                                        }}
                                                    >{suggestion.fromHistory ? <FaHistory /> : ''}{suggestion.title}</span>
                                                )
                                            })
                                        }
                                    </div>
                                    {
                                        suggestionList.length > 0 &&
                                        suggestionList[0].fromHistory &&
                                        <button
                                            onClick={() => {
                                                localStorage.setItem('searchHistory', JSON.stringify([]));
                                                setSuggestionList([]);
                                            }}
                                        >Clear recent searches</button>
                                    }
                                    {
                                        isSkeletonSuggestionLoading &&
                                        <div className={style.SuggestionBoxSkeleton}>
                                            <div className={`${style.SuggestionSkeleton}`}><span className={style.Skeleton}></span><span className={style.Skeleton}></span></div>
                                            <div className={`${style.SuggestionSkeleton}`}><span className={style.Skeleton}></span><span className={style.Skeleton}></span></div>
                                            <div className={`${style.SuggestionSkeleton}`}><span className={style.Skeleton}></span><span className={style.Skeleton}></span></div>
                                            <div className={`${style.SuggestionSkeleton}`}><span className={style.Skeleton}></span><span className={style.Skeleton}></span></div>
                                            <div className={`${style.SuggestionSkeleton}`}><span className={style.Skeleton}></span><span className={style.Skeleton}></span></div>
                                            <div className={`${style.SuggestionSkeleton}`}><span className={style.Skeleton}></span><span className={style.Skeleton}></span></div>
                                            <div className={`${style.SuggestionSkeleton}`}><span className={style.Skeleton}></span><span className={style.Skeleton}></span></div>
                                        </div>
                                    }
                                </div>
                                <div className={style.Sorting}>
                                    <span title='Ascending'
                                        className={`${sortType === 'ascending' ? style.ActiveSort : ''}`}
                                        onClick={() => {
                                            if (sortType !== 'ascending') {
                                                setSortType('ascending');
                                                setPageCount(1);
                                                setAlbums([]);
                                            }
                                            if (isOrderByDate) {
                                                setOrderByDate(false);
                                            }
                                        }}
                                    ><HiSortAscending /></span>
                                    <span title='Descending'
                                        className={`${sortType === 'descending' ? style.ActiveSort : ''}`}
                                        onClick={() => {
                                            if (sortType !== 'descending') {
                                                setSortType('descending')
                                                setPageCount(1);
                                                setAlbums([]);
                                            }
                                            if (isOrderByDate) {
                                                setOrderByDate(false);
                                            }
                                        }}
                                    ><HiSortDescending /></span>
                                </div>
                                <div
                                    className={style.Filtering}
                                    title='Filter'
                                    onClick={() => setShowFilter((prev) => !prev)}
                                >
                                    <IoFilter />
                                    <div
                                        className={`${style.FilterOptionList} ${!showFilter ? utilStyle.Hide : ''}`}
                                        onMouseLeave={() => setShowFilter(false)}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className={style.OptionWrapper}>
                                            <div className={style.OptionContainer}>
                                                <span
                                                    className={`${style.FilterOption} ${isOrderByDate ? style.ActiveFilter : ''}`}
                                                    onClick={() => {
                                                        setOrderByDate((prev) => !prev);
                                                        setPageCount(1);
                                                        setAlbums([]);
                                                        if (sortType) {
                                                            setSortType('');
                                                        }
                                                    }}
                                                >Order by creation</span>
                                            </div>
                                            <h3>Explore by genre</h3>
                                            <div className={style.OptionContainer}>
                                                {
                                                    genres.map(({ name, _id }) => {
                                                        return <span
                                                            className={`${style.FilterOption} ${genreFilters.includes(_id) ? style.ActiveFilter : ''}`}
                                                            key={_id}
                                                            onClick={() => {
                                                                handleGenreFilters(_id);
                                                            }}
                                                        >{name}</span>
                                                    })
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={style.Body}>

                            <div className={style.AlbumContainer}>
                                {
                                    albums.map((album, index) => {
                                        if ((albums.length - 1) === index) {
                                            return (
                                                <div
                                                    className={style.Album}
                                                    key={index}
                                                    ref={lastAlbumRef}
                                                    onClick={() => {
                                                        handleAlbumClick(album._id, index);
                                                    }}
                                                >
                                                    <div className={style.AlbumImage}>
                                                        <img src={`http://localhost:8080/api/media/image/albums/medium/${album.cover.name}`} />
                                                    </div>
                                                    <div className={style.TitleNTime}>
                                                        <span>{album.title}</span>
                                                        <i>{album.createdAt}</i>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        else {
                                            return (
                                                <div
                                                    className={style.Album}
                                                    key={index}
                                                    onClick={() => {
                                                        handleAlbumClick(album._id, index);
                                                    }}
                                                >
                                                    <div className={style.AlbumImage}>
                                                        <img src={`http://localhost:8080/api/media/image/albums/medium/${album.cover.name}`} />
                                                    </div>
                                                    <div className={style.TitleNTime}>
                                                        <span>{album.title}</span>
                                                        <i>{album.createdAt}</i>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    }
                                    )}
                            </div>

                            <div className={`${style.LazyLoadder} ${!isLoading ? utilStyle.Hide : ''}`}>
                                <LazyLoader1 className={style.LazyLoadder} />
                            </div>

                            {
                                albums.length <= 0 && !isLoading ?
                                    <div className={style.Container404}>
                                        <div className={style.Image404}><img src={resultsNotFound} /></div>
                                        <span>Albums not found.</span>
                                        <p>Follow instructions to obtain albums:</p>
                                        <ul>
                                            <li>Remove the filter and search again.</li>
                                            <li>Search using words, not characters.</li>
                                            <li>Suggestions can help to achieve accurate results.</li>
                                            <li>If there are no existing albums, please <Link to='/admin-panel/create-track'>create one</Link> before proceeding.</li>
                                        </ul>
                                    </div> : ''
                            }

                        </div>
                    </div>

                    {/* -------------------------------- right side ----------------------------------- */}
                    <div
                        className={`${style.AlbumSidebar} ${isSidebarExpanded ? utilStyle.ShowFlex : utilStyle.Hide}`}
                        style={{ '--primarySidebarBc': extractedColor.primarySidebarBc, '--secondarySidebarBc': extractedColor.secondarySidebarBc, '--selectedTrackBc': extractedColor.selectedTrackBc }}
                        onMouseEnter={() => setAlbumEditBtnHidden(false)}
                        onMouseLeave={() => setAlbumEditBtnHidden(true)}
                    >

                        {/* header - Sidebar header*/}
                        {
                            selectedAlbum &&
                            <>
                                <div className={`${style.AlbumEditBtn} ${!isAlbumEditBtnHidden ? style.ShowAlbumEditBtn : ''}`}>
                                    <button
                                        onClick={() => setAlbumEditOverlayHidden(false)}
                                        title='Edit album'
                                    >
                                        <span>Edit</span>
                                        <BiSolidEdit />
                                    </button>
                                    <button
                                        title='Delete album'
                                        onClick={onDeleteAlbumBtnClick}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>

                                <div className={`${style.AlbumSidebarHeader}`}>
                                    {
                                        !isSkeletonLoading &&
                                        <div
                                            className={style.CloseAlbumSidebarBtn}
                                            onClick={closeALbumSidebar}
                                        >
                                            <IoClose />
                                        </div>
                                    }
                                    <div className={style.HeaderItemPair}>
                                        <div className={style.HeaderItem}>
                                            <BsFillCalendarDayFill />
                                            <span>{selectedAlbum?.createdAt}</span>
                                        </div>
                                    </div>
                                    <div className={style.HeaderItemPair}>
                                        <div className={style.HeaderItem}>
                                            <IoMdEye />
                                            <span>Visitors 400K</span>
                                        </div>
                                        <div className={style.HeaderItem}>
                                            <span>{convertTimeToMinSec(selectedAlbum?.albumDuration)}</span>
                                            <IoTime />
                                        </div>
                                    </div>
                                    <div className={style.HeaderItemPair}>
                                        <div className={style.HeaderItem}>
                                            <MdFavorite />
                                            <span>Likes 150K</span>
                                        </div>
                                        <div className={style.HeaderItem}>
                                            <span>{`${selectedAlbum?.track?.length} Tracks`}</span>
                                            <MdAudiotrack />
                                        </div>
                                    </div>
                                </div>
                            </>
                        }

                        {/* body - Sidebar body*/}
                        {
                            selectedAlbum &&
                            <div className={style.AlbumSidebarBody}>
                                <div className={style.AlbumTitle}>
                                    <p>{selectedAlbum?.title}</p>
                                    <span>{selectedAlbum?.genre?.name}</span>
                                </div>
                                <div className={style.AlbumNTrackImgSection}>
                                    {
                                        selectedTrack ?
                                            <div className={style.SidebarTrackImgContainerWrapper}>
                                                <img src={`http://localhost:8080/api/media/image/tracks/medium/${selectedTrack.cover.name}`} />
                                                <div
                                                    className={style.SidebarTrackImgContainer}
                                                    onMouseEnter={handleSoundControlVisibility}
                                                    onMouseLeave={handleSoundControlInvisibility}
                                                >

                                                    <div className={style.AudioSettings} >
                                                        <MdOutlineSettingsSuggest
                                                            onMouseEnter={handleAudioSettingHover}
                                                        />
                                                        <div className={`${style.SettingsList} ${!isAudioSetttingsHidden ? style.ShowSettings : ''}`}>
                                                            <span>{audioSettings.autoplay ? 'Autoplay On' : 'Autoplay Off'}</span>
                                                            <span>{audioSettings.loopType === 1 ? 'Single Loop' : 'Album Loop'}</span>
                                                        </div>
                                                    </div>

                                                    <div className={style.SidebarTrackImg}>
                                                        <img src={`http://localhost:8080/api/media/image/tracks/medium/${selectedTrack.cover.name}`} />
                                                        {
                                                            !isAudioLoaded &&
                                                            <div className={style.LoaderOverlay}>
                                                                <BouncyLoader />
                                                            </div>
                                                        }
                                                    </div>

                                                    <div className={`${style.SoundControlOverlay} ${!isSoundControlHidden ? style.ShowSoundControl : ''}`}>
                                                        <InputRange
                                                            value={soundLevel}
                                                            onChange={handleSoundlevel}
                                                            railStyle={{
                                                                width: '3px'
                                                            }}
                                                            trackStyle={{
                                                                width: '3px',
                                                                backgroundColor: `${extractedColor.secondarySidebarBc}`
                                                            }}
                                                            handleStyle={{
                                                                height: '11px',
                                                                width: '11px',
                                                                margin: 'unset',
                                                                marginLeft: '-4px'
                                                            }}
                                                            vertical={true}
                                                        />
                                                        {soundLevel <= 0 ? <HiSpeakerXMark onClick={handleSoundMute} /> : <HiSpeakerWave onClick={handleSoundMute} />}
                                                    </div>

                                                    <div
                                                        className={style.TracksLikeOverlay}
                                                        onMouseEnter={() => setLikeCountHidden(false)}
                                                        onMouseLeave={() => setLikeCountHidden(true)}
                                                    >
                                                        <AiOutlineLike />
                                                        <span className={!isLikeCountHidden ? style.ShowLikeCount : ''}>50K</span>
                                                    </div>

                                                </div>
                                            </div>
                                            :
                                            <div className={style.SidebarAlbumImg}>
                                                <img src={`http://localhost:8080/api/media/image/albums/medium/${selectedAlbum?.cover.name}`} />
                                            </div>
                                    }
                                </div>
                                {
                                    selectedTrack &&
                                    <div className={style.Playbar}>
                                        <div className={style.TrackTitle}>
                                            <p ref={trackTitleRef} className={isTrackTitleOverflow ? utilStyle.SeamlessSlider : ''}>
                                                <span>{selectedTrack?.formattedTitle}</span>
                                                <span>{isTrackTitleOverflow && selectedTrack?.formattedTitle}</span>
                                            </p>
                                            <span>{selectedAlbum?.artist.name}</span>
                                        </div>
                                        <div className={style.Seekbar}>
                                            <InputRange
                                                trackStyle={{
                                                    backgroundColor: `${extractedColor.secondarySidebarBc}`
                                                }}
                                                onChange={onSeeking}
                                                onChangeComplete={onSeekEnd}
                                                value={audioSeekbarValue}
                                            />
                                        </div>
                                        <div className={style.Timer}>
                                            <span>{currentTime}</span>
                                            <span>{audioDuration}</span>
                                        </div>
                                        <div className={style.InteractionBtn}>
                                            <span
                                                onClick={() => handleAudioSettingClick('loopType')}
                                                title={audioSettings.loopType === 1 ? 'Single Loop' : 'Album Loop'}
                                            >{audioSettings.loopType === 1 ? <TbRepeatOnce /> : <TbRepeat />}</span>
                                            <div>
                                                <span className={style.SideBtn} onClick={() => navigateTo(-1, true)}><MdSkipPrevious /></span>
                                                {
                                                    isAudioLoaded ?
                                                        <span className={style.PlayNPauseBtn} onClick={togglePlayPause}>{isPlaying ? <IoPause /> : <IoPlay />}</span>
                                                        :
                                                        <span className={style.PlayPauseDisableBtn}>{isPlaying ? <IoPause /> : <IoPlay />}</span>
                                                }
                                                <span className={style.SideBtn} onClick={() => navigateTo(1, true)}><MdSkipNext /></span>
                                            </div>
                                            <span
                                                onClick={() => handleAudioSettingClick('autoplay')}
                                                title={audioSettings.autoplay ? 'Autoplay On' : 'Autoplay Off'}
                                            >
                                                <IoInfinite />
                                                {!audioSettings.autoplay && <div className={style.AutoplayOff} />}
                                            </span>
                                        </div>
                                    </div>
                                }
                            </div>
                        }

                        {/* footer - track list */}
                        {
                            selectedAlbum && selectedAlbum.track.length > 0 ?
                                <>
                                    <h2 className={style.TrackHeadingText}>Songs</h2>
                                    <div className={style.TrackContainer}>
                                        {
                                            selectedAlbum.track.map((track, index) => {
                                                return (
                                                    <div
                                                        className={`${style.Track} ${selectedTrack && (selectedTrack._id === track._id) ? style.SelectedTrack : ''}`}
                                                        key={index}
                                                        onClick={() => {
                                                            handleTrackClick(track, true);
                                                        }}
                                                    >
                                                        <div className={style.TrackImg}>
                                                            <img src={`http://localhost:8080/api/media/image/tracks/small/${track?.cover.name}`} />
                                                        </div>
                                                        <p>{track.name}</p>
                                                        <span><FaHeadphones /> 250K</span>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                </>
                                :
                                <h3 className={style.AlbumIsEmpty}>Look like your album is empty.</h3>
                        }

                        {/* edit album overlay */}
                        {
                            selectedAlbum &&
                            <EditAlbumOverlay isHidden={isAlbumEditOverlayHidden} />
                        }

                        <div className={`${style.SkeletonContainer} ${!isSkeletonLoading ? utilStyle.Hide : utilStyle.ShowFlex}`}>
                            <div className={`${style.SkeletonHeader} ${style.Skeleton}`}></div>
                            <div className={`${style.SkeletonName} ${style.Skeleton}`}></div>
                            <div className={`${style.SkeletonGenre} ${style.Skeleton}`}></div>
                            <div className={`${style.SkeletonImg} ${style.Skeleton}`}></div>
                            <div className={`${style.SkeletonSongTitle} ${style.Skeleton}`}></div>
                            <div className={style.SkeletonTrackContainer}>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                                <div className={`${style.SkeletonTrack} ${style.Skeleton}`}></div>
                            </div>
                        </div>


                    </div>
                    {/* <ToastContainer /> */}
                </div>
                :
                <InitSrcLoader />
            }
        </>
    )
}

export default Albums;
