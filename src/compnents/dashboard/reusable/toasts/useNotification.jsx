import toast from "react-hot-toast";
import notificationSound from "../../../../assets/notification.mp3"
import Notification from "./Notification";

const audio = new Audio(notificationSound);
const playSound = () => {
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch((error) => console.log(error));
}
export const showNotification = ({ message = '', notificationIcon, links = [], options = {} }) => {
    toast.custom((t) => {
        return (
            <Notification
                message={message}
                links={links}
                notificationIcon={notificationIcon}
                t={t}
            />
        )
    }, {
        duration: 6000,
        removeDelay: 300,
        position: 'top-center',
        ...options
    })
    playSound();
}