import { useEffect, useRef, useState } from 'react'
import { useMasterLayout } from '../layout.context'

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../../app.css';

import { LuImageMinus, TbPhotoEdit, IoClose, IoInformationCircleOutline, FaHeadphones, FiTrash2, BsCheckAll, TbListCheck } from '../../../utility';
import Checkbox from '../reusable/Checkbox';

import style from './editoverlay.module.css';

import ListOverlay from './ListOverlay';
import EditTrackOverlay from './EditTrackOverlay';

import DiscardPopup from './DiscardPopup';
import InfoPopup from './InfoPopup';
import DeleteConfirmationPopup from './DeleteConfirmationPopup';

import WavyPreloader from '../../loaders/WavyPreloader';
import LoaderContainer from './LoaderContainer';

function EditAlbumOverlay({ isHidden = false }) {
    const {
        // states
        isSelectModeEnableForDeleteTrack, tracksForEdit, tracksForDelete, deleteTrackConfirmationPopupConfig,
        isAlbumProcessing, isListLoaded, discardPopupConfig, isDiscardPopupHidden, isEditAlbumInfoDialogHidden, isGenreListHidden, selectedAlbum, updatedAlbumData, genres, selectedAlbumImgUrl, isDeleteTrackConfirmationPopupHidden, isDeleteAlbumConfirmationPopupHidden, deleteAlbumConfirmationPopupConfig,

        //setters
        setSelectModeEnableForDeleteTrack, setTracksForDelete, infoPopupForTrackDeletionConfig,
        setGenreListHidden, setUpdatedALbumData, setAlbumEditOverlayHidden,

        // methods
        toggleSelectModeForDeleteTrack, onTrackClickForDelete, toggleSelectAllTracksForDelete, onDeleteTrackBtnClick,
        onUpdateAlbum, closeEditAlbum, onTrackClickForEdit, onEditAlbumInfoBtnClick, onEditAlbumOverlayClick, onAlbumTitleBlur, onAlbumTitleChange, onAlbumImgEditBtnClick, manupulateUpdatedAlbumData, findNameById, onGenreChange, onAlbumImgChange, onResetAlbumImgBtnClick, restoreDefaultUpdatedAlbum

    } = useMasterLayout();

    // ================================================= states about albums  ================================================
    const [isAlbumTitleEditable, setAlbumTitleEditable] = useState(false);

    const albumTitleInputref = useRef(null);
    const albumImgInputRef = useRef(null);


    // ================================================= states about albums  ================================================
    useEffect(() => {
        if (albumTitleInputref.current) {
            albumTitleInputref.current.focus();
        }
    }, [isAlbumTitleEditable])

    return (
        <>
            <div
                className={`${style.EditAlbumOverlay} ${!isHidden ? style.ShowEditAlbumOverlayHidden : ''}`}
                onMouseEnter={(e) => e.stopPropagation()}
                onMouseLeave={(e) => e.stopPropagation()}
                onClick={onEditAlbumOverlayClick}
            >

                {/* ------------------------------------------------- to close sidebar ---------------------------------------------- */}
                <div
                    className={style.CloseBtn}
                    onClick={closeEditAlbum}
                >
                    <IoClose />
                </div>
                <div
                    className={style.InfoBtn}
                    onClick={onEditAlbumInfoBtnClick}
                >
                    <IoInformationCircleOutline />
                    <div
                        className={`${style.EditAlbumInfoDialog} ${!isEditAlbumInfoDialogHidden ? style.ShowEditAlbumInfoDialog : ''}`}
                    >Want to update your album details? Just click on any field you wish to edit and make your changes.
                    </div>
                </div>


                {/* ----------------------------album header ------------------------------- */}
                <div className={style.Header}>

                    <div className={style.AlbumTitleWrapper}>
                        {
                            !isAlbumTitleEditable ?
                                <span
                                    onClick={() => setAlbumTitleEditable(true)}
                                >{'title' in updatedAlbumData ? updatedAlbumData.title : selectedAlbum.title}</span>
                                :
                                <input
                                    type="text"
                                    value={'title' in updatedAlbumData ? updatedAlbumData.title : selectedAlbum.title}
                                    ref={albumTitleInputref}
                                    onBlur={() => {
                                        onAlbumTitleBlur();
                                        setAlbumTitleEditable(false);
                                    }}
                                    onChange={onAlbumTitleChange}
                                />
                        }
                    </div>

                    <div
                        className={style.ALbumGenre}
                        onClick={() => setGenreListHidden(false)}
                    >
                        <span
                            onClick={() => { }}
                        >{findNameById(genres, updatedAlbumData.genre) || selectedAlbum?.genre?.name}</span>

                        <ListOverlay
                            itemList={genres}
                            wrapperStyle={{ borderRadius: '16px' }}
                            selectedItem={updatedAlbumData.genre || selectedAlbum.genre._id}
                            onSelectChange={onGenreChange}
                            setHidden={setGenreListHidden}
                            isHiddden={isGenreListHidden}
                            isListLoaded={isListLoaded}
                        />

                    </div>

                    <div className={style.AlbumImg}>
                        <div
                            className={style.AlbumImgResetBtn}
                            style={{ display: `${updatedAlbumData.albumImage ? 'flex' : 'none'}` }}
                            onClick={onResetAlbumImgBtnClick}
                        >
                            <LuImageMinus />
                        </div>
                        <img src={selectedAlbumImgUrl ? selectedAlbumImgUrl : `http://localhost:8080/api/media/image/albums/medium/${selectedAlbum.cover.name}`} alt='album image' />
                        <div
                            className={style.AlbumImgEditBtn}
                            onClick={() => onAlbumImgEditBtnClick(albumImgInputRef)}
                        >
                            <TbPhotoEdit />
                            <input
                                type="file"
                                hidden
                                ref={albumImgInputRef}
                                onChange={onAlbumImgChange}
                            />
                        </div>
                    </div>

                    <div className={style.AlbumActionBtn}>
                        <span
                            onClick={restoreDefaultUpdatedAlbum}
                        >Restore default</span>
                        <button
                            onClick={onUpdateAlbum}
                        >Update</button>
                    </div>

                </div>


                {/* ----------------------------album body ------------------------------- */}
                <div className={style.Body}>
                    {
                        selectedAlbum.track.length > 0 ?
                            <>
                                <div className={style.BodyHeader}>
                                    <h2>Songs</h2>

                                    {
                                        isSelectModeEnableForDeleteTrack ?
                                            <button
                                                onClick={toggleSelectAllTracksForDelete}
                                            >{tracksForDelete.length > 0 ? 'Unselect all' : 'Select all'}</button>
                                            :
                                            <button
                                                title='Select tracks'
                                                onClick={toggleSelectModeForDeleteTrack}
                                            ><TbListCheck /></button>
                                    }



                                </div>
                                <div className={style.TrackContainer}>
                                    {
                                        selectedAlbum.track.map((track, index) => {
                                            return (
                                                <div
                                                    className={`${style.Track} ${isSelectModeEnableForDeleteTrack ? style.TrackSelectionStyle : ''}`}
                                                    key={index}
                                                    onClick={() => isSelectModeEnableForDeleteTrack ? onTrackClickForDelete(track) : onTrackClickForEdit(track)}
                                                >
                                                    {
                                                        isSelectModeEnableForDeleteTrack &&
                                                        <Checkbox
                                                            value={tracksForDelete.includes(track._id)}
                                                            boxStyle={{
                                                                height: '14px',
                                                                width: '14px',
                                                                marginLeft: '5px',
                                                                borderColor: 'var(--white-smoke)'
                                                            }}
                                                            iconStyle={{
                                                                color: 'var(--midnight-blue-2)'
                                                            }}
                                                            selectedStyle={{
                                                                box: {
                                                                    backgroundColor: 'var(--white-smoke)',
                                                                }
                                                            }}
                                                        />
                                                    }
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
                                {
                                    isSelectModeEnableForDeleteTrack &&
                                    <div className={style.BodyFooter}>
                                        <span>
                                            <BsCheckAll />
                                            {tracksForDelete.length} selected
                                        </span>
                                        <div className={style.BodyFooterBtnWrapper}>
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

                <EditTrackOverlay />

                {/* Delete Confirmation popup for album and track */}
                <DeleteConfirmationPopup
                    wrapperStyle={{ borderRadius: '16px' }}

                    title={'Delete Tracks?'}
                    message={`Are you sure you want to delete ${tracksForDelete.length} tracks from "${selectedAlbum.title}"? This action cannot be undone.`}
                    detailedMessage={
                        `Selected track : ${selectedAlbum.track.filter(track => tracksForDelete.includes(track._id))
                            .map(track => track.name).join(', ')}`
                    }
                    confirmationString={`${selectedAlbum.title} TRACKS`}

                    isHidden={isDeleteTrackConfirmationPopupHidden}
                    onCancel={deleteTrackConfirmationPopupConfig.onCancel}
                    onDelete={deleteTrackConfirmationPopupConfig.onDelete}
                />

                {/* discard popup for album and track */}
                <DiscardPopup
                    wrapperStyle={{ borderRadius: '16px' }}
                    onDiscard={discardPopupConfig.onDiscard}
                    onCancel={discardPopupConfig.onCancel}
                    isHidden={isDiscardPopupHidden}
                />

                {/* Information popup for Playback Interruption */}
                <InfoPopup
                    wrapperStyle={{ borderRadius: '16px' }}
                    title={"Playback Interrupted"}
                    message={"Your playback has been paused as the track currently playing was selected for deletion. You may resume playback with a different track if needed."}

                    onOk={infoPopupForTrackDeletionConfig.onOk}
                    isHidden={infoPopupForTrackDeletionConfig.isHidden}
                />

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


            {/* loading for album and track */}
            <LoaderContainer
                containerStyle={{ borderRadius: '16px' }}
                loader={WavyPreloader}
                isHidden={!isAlbumProcessing}
            />

        </>
    )
}

export default EditAlbumOverlay
