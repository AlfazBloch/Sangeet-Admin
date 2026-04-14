import { useState } from 'react';
import style from './style.module.css'
import { handleImgFile } from '../../../utility.js';
import { useLayoutManager } from './manager.context.js';

function FailedAlbums() {
    const { processedUnpublishedAlbums: { failed: { albums: failedAlbums } }, selectedAlbumFile, setSelectedAlbumFile, resetSelectedAlbumFile, handleAlbumDelete, handleAlbumDiscard, updateAlbum } = useLayoutManager();
    const [isImagePreviewed, setImagePreviewed] = useState(false);

    const handleBrowseBtnClick = (id) => {
        const fileInputElement = document.getElementById(`album-${id}`);
        fileInputElement.click();
    }
    const handleAlbumImageChange = (e, id) => {
        handleImgFile(e, (file, result, error) => {
            if (error) {
                return;
            }
            setSelectedAlbumFile({
                albumId: id,
                file,
                objectUrl: result
            })
        })
    }


    return (
        <>
            {

                failedAlbums.length <= 0 &&
                <div className={style.NotFoundContainer}>
                    <h2>No failed albums to display.</h2>
                </div>

            }
            {
                failedAlbums.map((album, index) => {
                    return (
                        <div className={style.Node} style={{ backgroundColor: `var(${index % 2 === 0 ? '--blue-shade-2' : '--blue-shade-1'})` }} key={album.id}>
                            <div className={style.NodeName}>
                                <span>{album.name}</span>
                            </div>
                            <div className={style.NodeActions}>
                                <input
                                    type="file"
                                    id={`album-${album.id}`}
                                    onChange={(e) => handleAlbumImageChange(e, album.id)}
                                    accept='image/*'
                                    hidden
                                />
                                {
                                    selectedAlbumFile && selectedAlbumFile.albumId === album.id ?
                                        <>
                                            <div className={style.ImageBox} title='preview image' onClick={() => setImagePreviewed(true)}>
                                                <img src={selectedAlbumFile.objectUrl} alt="album image" />
                                            </div>

                                            <div
                                                className={`${style.ImagePreviewer} ${isImagePreviewed ? style.ShowImagePreview : ''}`}
                                                onClick={() => setImagePreviewed(false)}
                                            >
                                                <img src={selectedAlbumFile.objectUrl} alt="album image" />
                                            </div>

                                            <span onClick={resetSelectedAlbumFile}>Cancel</span>
                                            <span onClick={updateAlbum}>Upload</span>
                                        </>
                                        :
                                        <>
                                            <span onClick={() => handleBrowseBtnClick(album.id)}>Browse</span>
                                            {
                                                album.action === 'create' ?
                                                    <span onClick={() => handleAlbumDelete(album.id, album.name)}>Delete</span>
                                                    :
                                                    <span onClick={() => handleAlbumDiscard(album.id, album.name)}>Discard</span>
                                            }

                                        </>
                                }
                            </div>
                        </div>
                    )
                })
            }
        </>
    )
}

export default FailedAlbums;