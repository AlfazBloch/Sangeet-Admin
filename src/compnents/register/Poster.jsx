import React from 'react'
import style from './style.module.css'
import { posters } from '../../assets/';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// import required modules
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Navigation, Pagination, Autoplay } from 'swiper/modules';


function Poster() {
  return (  
    <Swiper 
        className={style.Swiper}
        spaceBetween={30}
        effect={'fade'}
        modules={[EffectFade, Navigation, Pagination, Autoplay]}
        autoplay = {{
            delay: 5000,
            disableOnInteraction: false
        }}
        speed={3000}
        loop = {true}
        allowTouchMove = {false}
        simulateTouch = {false}
    >
        {posters.map((poster) => {
            return (
                <SwiperSlide key={poster} className={style.SwiperSlide}>
                    <img src={poster} />
                </SwiperSlide>
            )
        })}
    </Swiper>
  )
}

export default Poster
