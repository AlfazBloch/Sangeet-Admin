import { } from 'react';
import style from './style.module.css';
import { FaRegFolder, FaRegFolderOpen, GoGear, IoIosArrowDown, IoIosArrowForward } from '../../../utility.js';

function Node({ unPublishedAlbum, handleOpenAlbum, isOpen, handleOpenTrack, openedTracks = [], getNextNodeCount }) {
    const baseCount = getNextNodeCount();
    const getBC = (value) => {
        if (value % 2 === 0) {
            return '--blue-shade-2';
        }
        else {
            return '--blue-shade-1';
        }
    }
    return (
        <div className={style.NodeWrapper}>
            <div className={style.Node} style={{ backgroundColor: `var(${getBC(baseCount)})` }} onClick={() => handleOpenAlbum(unPublishedAlbum.id)}>
                <div className={style.NodeName}>
                    {isOpen ?
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
                    <span className={style.Badge} style={{ backgroundColor: unPublishedAlbum.statusColor }}>{unPublishedAlbum.status}</span>
                    <span>{unPublishedAlbum.totalProcesses}</span>
                </div>
            </div>

            {isOpen &&
                <div className={style.NodeWrapper} >
                    {
                        unPublishedAlbum.processes.map(process => {
                            const nextCount = getNextNodeCount();
                            return (
                                <div className={style.NodeProcess} key={process.operation} style={{ paddingLeft: '20px', backgroundColor: `var(${getBC(nextCount)})` }}>
                                    <div className={style.ProcessName}>
                                        <GoGear />
                                        <span>{process.operation}</span>
                                    </div>
                                    <span className={style.Badge} style={{ backgroundColor: process.statusColor }}>{process.status}</span>
                                </div>
                            )
                        })
                    }
                    {
                        unPublishedAlbum.tracks.map(track => {
                            const nextCount = getNextNodeCount();
                            return (
                                <div className={style.NodeWrapper} key={track.id}>
                                    <div className={style.Node} style={{ paddingLeft: '20px', backgroundColor: `var(${getBC(nextCount)})` }} onClick={() => handleOpenTrack(track.id)}>
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
                                            <span className={style.Badge} style={{ backgroundColor: track.statusColor }}>{track.status}</span>
                                            <span>{track.totalProcesses}</span>
                                        </div>
                                    </div>

                                    {
                                        openedTracks.includes(track.id) &&
                                        <div className={style.NodeWrapper}>
                                            {
                                                track.processes.map(process => {
                                                    const nextCount = getNextNodeCount();
                                                    return (
                                                        <div className={style.NodeProcess} key={process.operation} style={{ paddingLeft: '40px', backgroundColor: `var(${getBC(nextCount)})` }}>
                                                            <div className={style.ProcessName}>
                                                                <GoGear />
                                                                <span>{process.operation}</span>
                                                            </div>
                                                            <span className={style.Badge} style={{ backgroundColor: process.statusColor }}>{process.status}</span>
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

export default Node;