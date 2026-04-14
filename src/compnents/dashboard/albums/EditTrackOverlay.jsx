import { useEffect, useRef, useState } from 'react'
import { useMasterLayout } from '../layout.context'

import style from './editoverlay.module.css';
import { MdModeEdit, IoMdArrowRoundBack, IoPlay, LuImageMinus, RiExchangeLine, TbPhotoEdit, CgUserAdd, IoClose, IoPause } from '../../../utility';

import ListOverlay from './ListOverlay';
import InputRange from '../reusable/InputRange.jsx';
import RestoreDefaultPopup from './RestoreDefaultPopup.jsx';

function EditTrackOverlay() {

    const {
        // states
        isListLoaded, isRestoreDefaultPopupHidden, featuredArtists, languages, isLanguageListHidden, updatedTrackData, isTrackListHidden, trackForEdit, selectedAlbum, selectedTrackImgUrl, editTrackPlaybackStates,

        // setters
        setTrackListHidden, setTrackForEdit, setLanguageListHidden,

        // methods
        onUpdateTrack, restoreSomeUpdatedTrack, hideRestoreDefaultPopup, showRestoreDefaultPopup, backToEditAlbum, findNameById, onTrackTitleChange, onTrackTitleBlur, onSelectTrackChange, onTrackImgChange, onResetTrackImageBtnClick, onTrackLanguageChange, onTrackAudioChange, onPlayPauseBtnClick, onEditTrackAudioSeek,
        onResetTrackAudioBtnClick, onFeaturedArtistKeyDown, removeFeaturedArtist, addFeaturedArtist,

    } = useMasterLayout();

    // states
    const [isTrackTitleEditable, setTrackTitleEditable] = useState(false);
    const [isEditFtArtistsHidden, setEditFtArtistsHidden] = useState(true);
    const trackTitleInputRef = useRef();
    const trackImgInputRef = useRef();
    const trackAudioInputRef = useRef();
    const ftArtistsInputRef = useRef();

    useEffect(() => {
        if (trackTitleInputRef.current) {
            trackTitleInputRef.current.focus();
        }
    }, [isTrackTitleEditable]);

    return (
        <div
            className={`${style.EditTrackOverlay} ${trackForEdit ? style.ShowOverlay : ''}`}>

            <div
                className={style.BackToEditAlbumBtn}
                onClick={backToEditAlbum}
            >
                <IoMdArrowRoundBack />
            </div>


            {
                trackForEdit &&
                <>
                    <div
                        className={style.SwitchTrackWrapper}
                        title='Switch track'
                        onClick={() => setTrackListHidden(false)}
                    >
                        <span>{trackForEdit.name}</span>
                        <RiExchangeLine />
                        <ListOverlay
                            wrapperStyle={{ 'borderRadius': '16px' }}
                            itemList={selectedAlbum.track}
                            selectedItem={trackForEdit._id}
                            onSelectChange={onSelectTrackChange}
                            setHidden={setTrackListHidden}
                            isHiddden={isTrackListHidden}
                            isListLoaded
                        />
                    </div>

                    <div className={style.TrackGenre}>
                        {selectedAlbum.genre.name}
                    </div>

                    <div className={style.EditTrackCenter}>

                        <div className={style.TrackImgWrapper}>

                            <img
                                src={selectedTrackImgUrl ? selectedTrackImgUrl : `http://localhost:8080/api/media/image/tracks/medium/${trackForEdit.cover.name}`}
                                alt='Track image'
                            />

                            <div className={style.TrackImgContainer}>

                                <span
                                    className={style.ResetTrackImgBtn}
                                    style={{ display: `${selectedTrackImgUrl ? 'flex' : 'none'}` }}
                                    title='Reset image'
                                    onClick={onResetTrackImageBtnClick}
                                >
                                    <LuImageMinus />
                                </span>

                                <img
                                    src={selectedTrackImgUrl ? selectedTrackImgUrl : `http://localhost:8080/api/media/image/tracks/medium/${trackForEdit.cover.name}`}
                                    alt='Track image'
                                />

                                <input
                                    type="file"
                                    onChange={onTrackImgChange}
                                    ref={trackImgInputRef}
                                    hidden
                                    accept='image/*'
                                />

                                <span
                                    className={style.EditTrackImgBtn}
                                    title='Edit image'
                                    onClick={() => {
                                        trackImgInputRef.current.click()
                                    }}
                                >
                                    <TbPhotoEdit />
                                </span>

                            </div>

                        </div>

                        <div className={style.EditTrackTitleWrapper}>
                            {
                                !isTrackTitleEditable ?
                                    <span
                                        onClick={() => setTrackTitleEditable(true)}
                                        title='Edit name'
                                    >{'name' in updatedTrackData ? updatedTrackData.name : trackForEdit.name}</span>
                                    :
                                    <input
                                        type="text"
                                        title='Edit name'
                                        value={'name' in updatedTrackData ? updatedTrackData.name : trackForEdit.name}
                                        onChange={onTrackTitleChange}
                                        onBlur={() => {
                                            onTrackTitleBlur();
                                            setTrackTitleEditable(false);
                                        }}
                                        ref={trackTitleInputRef}
                                    />
                            }
                        </div>

                        <div
                            className={style.EditTrackLanguageWrapper}
                            title='Edit language'
                        >
                            <span
                                onClick={() => setLanguageListHidden(false)}
                            >
                                {'language' in updatedTrackData ? findNameById(languages, updatedTrackData.language) : trackForEdit.language.name}
                            </span>
                            <ListOverlay
                                wrapperStyle={{ borderRadius: '16px' }}
                                itemList={languages}
                                selectedItem={'language' in updatedTrackData ? updatedTrackData.language : trackForEdit.language._id}
                                onSelectChange={onTrackLanguageChange}
                                setHidden={setLanguageListHidden}
                                isHiddden={isLanguageListHidden}
                                isListLoaded={isListLoaded}
                            />
                        </div>

                        <div
                            className={style.Seekbar}
                            style={{ display: `${'trackFile' in updatedTrackData ? 'flex' : 'none'}` }}
                        >

                            <span
                                onClick={onPlayPauseBtnClick}
                            >{editTrackPlaybackStates.isPlaying ? <IoPause /> : <IoPlay />}</span>

                            <InputRange
                                value={editTrackPlaybackStates.seekVal}
                                onChange={onEditTrackAudioSeek}
                            />

                            <span>
                                {`${editTrackPlaybackStates.curTime} / ${editTrackPlaybackStates.duration}`}
                            </span>

                        </div>

                        <div className={style.TrackEditNResetBtns}>

                            <button
                                onClick={onResetTrackAudioBtnClick}
                                style={{
                                    opacity: `${'trackFile' in updatedTrackData ? 1 : 0}`,
                                    pointerEvents: `${'trackFile' in updatedTrackData ? 'unset' : 'none'}`
                                }}
                            >Reset track</button>

                            <button
                                onClick={() => {
                                    trackAudioInputRef.current.click()
                                }}
                            >

                                Browse track
                                <input
                                    type="file"
                                    accept='audio/*'
                                    ref={trackAudioInputRef}
                                    onChange={onTrackAudioChange}
                                    hidden
                                />

                            </button>

                        </div>

                    </div>

                    <div className={style.FtArtistsWrapper}>

                        <h2
                            title='Manage featured artists'
                            onClick={() => {
                                setEditFtArtistsHidden(false)
                            }}
                        >Featured artists <MdModeEdit /></h2>
                        <div className={style.FtArtists}>
                            {
                                featuredArtists.map((featuredArtist, index) => {
                                    return (
                                        <span key={index}>{featuredArtist}</span>
                                    )
                                })
                            }
                        </div>

                    </div>

                    <div
                        className={`${style.EditFtArtistOverlay} ${!isEditFtArtistsHidden ? style.ShowOverlay : ''}`}
                        onClick={() => {
                            setEditFtArtistsHidden(true)
                        }}
                    >
                        <h2>Manage Featured Artists</h2>
                        <div
                            className={style.FtArtistInputWrapper}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="text"
                                placeholder='Add featured artist'
                                ref={ftArtistsInputRef}
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                    onFeaturedArtistKeyDown(e, ftArtistsInputRef)
                                }}
                            />
                            <span
                                title='Add featured artist'
                                onClick={(e) => {
                                    addFeaturedArtist(ftArtistsInputRef);
                                }}
                            ><CgUserAdd /></span>
                        </div>
                        <div
                            className={style.FtArtistsList}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {
                                featuredArtists.map((featuredArtist, index) => {
                                    return (
                                        <span
                                            key={index}
                                            title='Remove'
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFeaturedArtist(index);
                                            }}
                                        >{featuredArtist} <IoClose /></span>
                                    )
                                })
                            }
                        </div>
                    </div>

                    <div
                        className={style.EditTrackActionBtn}
                    >

                        <button onClick={showRestoreDefaultPopup}>Restore Default</button>
                        <button onClick={onUpdateTrack}>Update</button>

                    </div>
                </>
            }
            <RestoreDefaultPopup
                wrapperStyle={{ borderRadius: '16px' }}
                changes={updatedTrackData}
                isHidden={isRestoreDefaultPopupHidden}
                onCancel={hideRestoreDefaultPopup}
                onRestore={restoreSomeUpdatedTrack}
            />
        </div>
    )
}

export default EditTrackOverlay
