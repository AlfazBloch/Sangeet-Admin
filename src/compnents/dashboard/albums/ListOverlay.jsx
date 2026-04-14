import style from './editoverlay.module.css'
import { MdRadioButtonChecked, MdRadioButtonUnchecked } from 'react-icons/md';

function ListOverlay({ itemList = [], selectedItem, onSelectChange = () => { }, setHidden = () => { }, isListLoaded = false, isHiddden = false, wrapperStyle = {} }) {

    const onChange = (e, id) => {
        e.stopPropagation();
        onSelectChange(id);
        setHidden(true);
    }
    const onClose = (e) => {
        e.stopPropagation();
        setHidden(true);
    }

    return (
        <div
            className={`${style.ListOverlayWrapper} ${!isHiddden ? style.ShowOverlay : ''}`}
            onClick={onClose}
            style={{ ...wrapperStyle }}
        >
            {
                isListLoaded ?
                    <div className={style.ItemList}>
                        {
                            itemList.map(({ name, _id }) => {
                                return (
                                    <div
                                        key={_id}
                                        className={style.Item}
                                        onClick={(e) => {
                                            setHidden(true);
                                            if (selectedItem === _id) return; 
                                            onChange(e, _id);
                                        }}
                                    >
                                        {name}
                                        {selectedItem === _id ? <MdRadioButtonChecked /> : <MdRadioButtonUnchecked />}
                                    </div>
                                )
                            })
                        }
                    </div>
                    :
                    <div className={style.SkeletonContainer}>
                        {
                            Array.from({ length: 15 }, (_, index) => (
                                <div key={index} className={style.SkeletonItem}>
                                    <span></span>
                                    <span></span>
                                </div>
                            ))
                        }
                    </div>
            }

        </div>
    )
}

export default ListOverlay
