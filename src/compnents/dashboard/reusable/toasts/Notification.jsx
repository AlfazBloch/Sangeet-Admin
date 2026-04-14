import { useState } from 'react'
import style from './style.module.css'
import { Link } from 'react-router-dom'
import { IoClose } from '../../../../utility.js'
import toast from 'react-hot-toast'

const Notification = ({ message, links = [], notificationIcon, t }) => {
    const [dismiss, setDismiss] = useState(true);
    const hanleDismissClick = () => {
        setDismiss(false);
        toast.dismiss(t.id);
    };

    return (
        <div className={`${style.Notification} ${!dismiss ? style.Dismiss : ''}`}>
            <span>{notificationIcon}</span>
            <p>{message}</p>
            <div className={style.Navlinks}>
                {
                    links.map(({ icon, title, to }, index) => {
                        return (
                            <Link key={index} to={to}>{icon}{title}</Link>
                        )
                    })
                }
            </div>
            <button onClick={hanleDismissClick}><IoClose /></button>
        </div>
    )
}

export default Notification
