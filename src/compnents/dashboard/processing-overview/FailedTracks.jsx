import { useEffect, useState, useRef } from 'react'
import { toast } from 'react-toastify'
import { useMasterLayout } from '../layout.context.js';

import style from './style.module.css';
import InputRange from '../reusable/InputRange.jsx';

import { FaRegFolder, FaRegFolderOpen, formatTime, getItemFromLocalStorage, GoGear, handleImgFile, IoIosArrowDown, IoIosArrowForward, IoPause, IoPlay, toastOption } from '../../../utility.js'
import { useLayoutManager } from './manager.context.js';


function FailedTracks() {

  //useContext
  const { selectedAlbum, closeALbumSidebar, setAudioConflictPopUpHidden } = useMasterLayout();
  const { processedUnpublishedAlbums: { failed: { tracks: failedTracks } }, selectedTrackFiles, setSelectedTrackFiles, openedFailedTracks, handleOpenFailedTracks, audioPlaybackState, handleAudioPlayPause, handleAudioSeek, resetSelectedTrackFiles, handleTrackDelete, handleTrackDiscard, updateTrack } = useLayoutManager();

  const [isImagePreviewed, setImagePreviewed] = useState(false);
  let nodeCount = -1;

  const getNextNodeCount = () => nodeCount += 1;
  const getBc = (count) => count % 2 === 0 ? 'var(--blue-shade-2)' : 'var(--blue-shade-1)';

  // handle browser click and change event { image, audio }
  const handleBrowseImgBtnClick = (id) => {
    const fileInputElement = document.getElementById(`track-image-${id}`);
    fileInputElement.click();
  }
  const handleTrackImgChange = (e, id, albumId) => {
    handleImgFile(e, (file, result, error) => {
      if (error) {
        return;
      }

      if (selectedTrackFiles && selectedTrackFiles.trackId === id) {
        setSelectedTrackFiles(prev => {
          return { ...prev, image: { file, objectUrl: result } }
        });
      }
      else {
        setSelectedTrackFiles({ trackId: id, image: { file, objectUrl: result }, albumId })
      }
    })
  }
  const handleBrowseAudioBtnClick = (id) => {
    const fileInputElement = document.getElementById(`track-audio-${id}`);
    fileInputElement.click();
  }
  const handleTrackAudioChange = (e, id, albumId) => {
    // set data for update when browse audio
    const file = e.target.files[0];
    if (!file) {
      toast.error('No file selected.', toastOption);
    }
    if (!file.type.startsWith('audio/')) {
      toast.error('File must be an audio.', toastOption);
    }

    const objectUrl = URL.createObjectURL(file);
    if (selectedTrackFiles && selectedTrackFiles.trackId === id) {
      setSelectedTrackFiles(prev => {
        return { ...prev, audio: { file, objectUrl } }
      });
    }
    else {
      setSelectedTrackFiles({ trackId: id, audio: { file, objectUrl }, albumId })
    }

    // show audio conflic popup
    if (selectedAlbum) {
      const keepAudioConflictInfoPopUpHidden = getItemFromLocalStorage('keepAudioConflictInfoPopUpHidden', 'bool');
      closeALbumSidebar();

      if (keepAudioConflictInfoPopUpHidden) return;
      setAudioConflictPopUpHidden(false);
    }
  }

  return (
    <>
      {
        failedTracks.length <= 0 &&
        <div className={style.NotFoundContainer}>
          <h2>No failed tracks to display.</h2>
        </div>
      }
      {
        failedTracks.map(track => {
          const isTrackMatched = selectedTrackFiles && selectedTrackFiles.trackId === track.id;
          const showUpdateBtn = isTrackMatched &&
            (
              (track.processes.length === 2 && (selectedTrackFiles.image && selectedTrackFiles.audio)) ||
              (track.processes.length === 1 && (selectedTrackFiles.image || selectedTrackFiles.audio))
            );
          return (
            <div className={style.NodeWrapper} key={track.id}>

              <div className={style.Node} style={{ backgroundColor: getBc(getNextNodeCount()), cursor: 'pointer' }} onClick={() => handleOpenFailedTracks(track.id)}>
                <div className={style.NodeName}>
                  {
                    openedFailedTracks.includes(track.id) ?
                      <>
                        <IoIosArrowDown />
                        <FaRegFolderOpen />
                      </>
                      :
                      <>
                        <IoIosArrowForward />
                        <FaRegFolder />
                      </>
                  }
                  <span>{track.name}</span>
                </div>
                <div className={style.NodeData}>
                  <span>{track.processes.length}</span>
                  {
                    isTrackMatched &&
                    <span onClick={(e) => {
                      e.stopPropagation();
                      resetSelectedTrackFiles()
                    }}>Cancel</span>
                  }
                  {
                    showUpdateBtn ?
                      <span onClick={(e) => {
                        e.stopPropagation();
                        updateTrack()
                      }}>Upload</span>
                      :
                      track.action === 'create' ?
                        <span onClick={(e) => {
                          e.stopPropagation();
                          handleTrackDelete(track.id, track.name, track.albumId)
                        }}>Delete</span>
                        :
                        <span onClick={(e) => {
                          e.stopPropagation();
                          handleTrackDiscard(track.id, track.name, track.albumId)
                        }}>Discard</span>
                  }
                </div>
              </div>

              {
                openedFailedTracks.includes(track.id) &&
                <div className={style.NodeWrapper} >
                  {
                    track.processes.map(process => {
                      return (
                        <div className={style.NodeProcess} style={{ paddingLeft: '20px', backgroundColor: getBc(getNextNodeCount()) }} key={process.type}>

                          <div className={style.ProcessName}>
                            <GoGear />
                            <span>{process.operation}</span>
                          </div>

                          {
                            process.type === 'image' ?
                              <div className={style.ProcessAction}>
                                {
                                  isTrackMatched && selectedTrackFiles.image &&
                                  <>
                                    <div className={style.ImageBox} title='preview image' onClick={() => setImagePreviewed(true)}>
                                      <img src={selectedTrackFiles.image.objectUrl} alt='track image' />
                                    </div>

                                    <div
                                      className={`${style.ImagePreviewer} ${isImagePreviewed ? style.ShowImagePreview : ''}`}
                                      onClick={() => setImagePreviewed(false)}
                                    >
                                      <img src={selectedTrackFiles.image.objectUrl} alt='track image' />
                                    </div>
                                  </>
                                }

                                <span onClick={() => handleBrowseImgBtnClick(track.id)}>Browse</span>
                                <input
                                  type="file"
                                  id={`track-image-${track.id}`}
                                  onChange={(e) => handleTrackImgChange(e, track.id, track.albumId)}
                                  accept='image/*'
                                  hidden
                                />
                              </div>
                              :
                              <div className={style.ProcessAction}>
                                {
                                  isTrackMatched && selectedTrackFiles.audio &&

                                  <div className={style.AudioPreviewer}>

                                    <span onClick={handleAudioPlayPause}>
                                      {audioPlaybackState.isPlaying ? <IoPause /> : <IoPlay />}
                                    </span>

                                    <InputRange
                                      value={audioPlaybackState.seekValue}
                                      onChange={handleAudioSeek}
                                      railStyle={{
                                        backgroundColor: `var(--silver)`
                                      }}
                                      trackStyle={{
                                        backgroundColor: `var(--blue-shade-5)`
                                      }}
                                      handleStyle={{
                                        height: '10px',
                                        width: '10px',
                                        marginTop: '-3px',
                                        backgroundColor: `var(--blue-shade-5)`
                                      }}
                                    />
                                    <span>{formatTime(audioPlaybackState.duration)}</span>
                                  </div>
                                }

                                <span onClick={() => handleBrowseAudioBtnClick(track.id)}>Browse</span>
                                <input
                                  type="file"
                                  id={`track-audio-${track.id}`}
                                  onChange={(e) => handleTrackAudioChange(e, track.id, track.albumId)}
                                  accept='audio/*'
                                  hidden
                                />
                              </div>
                          }
                        </div>
                      )
                    })
                  }
                </div>
              }

            </div>
          )
        })
      }
    </>
  )
}

export default FailedTracks