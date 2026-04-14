import style from './style.module.css';
import WavyPreloader from '../../loaders/WavyPreloader';
function InitSrcLoader() {
  return (
    <div className={style.InitSrcLoader}>
        <WavyPreloader />
    </div>
  )
}

export default InitSrcLoader
