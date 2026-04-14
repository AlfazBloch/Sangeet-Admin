import Node from './Node';
import style from './style.module.css';
import { useLayoutManager } from './manager.context';

function NodeContainer() {
    const { processedUnpublishedAlbums, toggleStatus, openedAwaitingAlbums, handleOpenAwaitingAlbum, openedAwaitingTracks, handleOpenAwaitingTrack } = useLayoutManager();

    let currentNodeCount = -1;                              //including nested node/
    const getNextNodeCount = () => currentNodeCount += 1;

    const sortedUnpublishedAlbums = toggleStatus === 'processing' ?
        [...processedUnpublishedAlbums.processing, ...processedUnpublishedAlbums.pending] : [...processedUnpublishedAlbums.pending, ...processedUnpublishedAlbums.processing];

    return (
        <>
            {
                sortedUnpublishedAlbums.length <= 0 &&
                <div className={style.NotFoundContainer}>
                    <h2>No tracks or albums are queued or being processed right now.</h2>
                </div>
            }
            {

                sortedUnpublishedAlbums.map(album => {
                    return (
                        <Node
                            key={album.id}
                            unPublishedAlbum={album}
                            handleOpenAlbum={handleOpenAwaitingAlbum}
                            isOpen={openedAwaitingAlbums.includes(album.id)}
                            handleOpenTrack={handleOpenAwaitingTrack}
                            openedTracks={openedAwaitingTracks}
                            getNextNodeCount={getNextNodeCount}
                        />
                    )
                })
            }
        </>
    )
}

export default NodeContainer