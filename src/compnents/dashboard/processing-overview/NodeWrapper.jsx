import { useState } from 'react';
import style from './style.module.css';
import { FaRegFolder, FaRegFolderOpen, GoGear, IoIosArrowDown, IoIosArrowForward } from '../../../utility.js';

function NodeWrapper({ unPublishedAlbum }) {
    const [isAlbumOpen, setAlbumOpen] = useState(false);
    const [openedTracks, setOpenedTracks] = useState([]);

    const handleAlbumClick = () => {
        setAlbumOpen(prev => !prev);
    }
    const handleTrackOpenAndClose = (id) => {
        const tracks = [...openedTracks];
        const trackIndex = tracks.findIndex(trackId => trackId === id);
        if (trackIndex >= 0) {
            tracks.splice(trackIndex, 1);
        }
        else {
            tracks.push(id);
        }
        setOpenedTracks(tracks);
    }

    return (
        <div className={style.NodeWrapper}>
            <div className={style.Node} onClick={handleAlbumClick}>
                <div className={style.NodeName}>
                    {isAlbumOpen ?
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
                    <span>{unPublishedAlbum.name}</span>
                </div>
                <div className={style.NodeData}>
                    <span className={style.Badge}>{unPublishedAlbum.status}</span>
                    <span>{unPublishedAlbum.totalprocesses}</span>
                </div>
            </div>

            {isAlbumOpen &&
                <div className={style.NodeWrapper} style={{ backgroundColor: `var(--ciment)` }}>
                    {
                        unPublishedAlbum.processes.map(process => {
                            return (
                                <div className={style.NodeProcess} style={{ paddingLeft: '20px' }} key={process.operation}>
                                    <div className={style.ProcessName}>
                                        <GoGear />
                                        <span>{process.operation}</span>
                                    </div>
                                    <span className={style.Badge}>{process.status}</span>
                                </div>
                            )
                        })
                    }
                    {
                        unPublishedAlbum.tracks.map(track => {
                            return (
                                <div className={style.NodeWrapper} style={{ backgroundColor: `var(--white-smoke)` }} key={track.id}>
                                    <div className={style.Node} style={{ paddingLeft: '20px' }} onClick={() => handleTrackOpenAndClose(track.id)}>
                                        <div className={style.NodeName}>
                                            {openedTracks.includes(track.id) ?
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
                                            <span className={style.Badge}>{track.status}</span>
                                            <span>{track.totalprocesses}</span>
                                        </div>
                                    </div>

                                    {
                                        openedTracks.includes(track.id) &&
                                        <div className={style.NodeWrapper} style={{ backgroundColor: `var(--white-smoke)` }}>
                                            {
                                                track.processes.map(process => {
                                                    return (
                                                        <div className={style.NodeProcess} style={{ paddingLeft: '40px', backgroundColor: `var(--ciment)` }} key={process.operation}>
                                                            <div className={style.ProcessName}>
                                                                <GoGear />
                                                                <span>{process.operation}</span>
                                                            </div>
                                                            <span className={style.Badge}>{process.status}</span>
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
                </div>
            }
        </div >
    )
}

export default NodeWrapper;