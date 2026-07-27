import React, { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaPlayCircle, FaClock } from "react-icons/fa";
import SwiperCore, { Navigation, Pagination, Autoplay } from "swiper";
import "swiper/swiper-bundle.css";
import { H } from "./hero.style";
SwiperCore.use([Navigation, Pagination, Autoplay]);
import { useTrendingAnime } from "../../hooks/useAnime";

const SkeletonSlide = () => (
  <H.Slides>
    <H.ImgContainer>
      <H.Img src="" alt="" style={{ background: '#3d3e44', filter: 'none' }} />
    </H.ImgContainer>
    <H.Content>
      <H.Rank><p style={{ opacity: 0.4 }}>{'     '}</p></H.Rank>
      <H.Title style={{ background: '#4a4b51', borderRadius: 4, width: '60%', height: 40, color: 'transparent' }}>{' '}</H.Title>
      <H.Icons>
        <H.Icon style={{ background: '#4a4b51', borderRadius: 4, width: 60, height: 16, color: 'transparent' }}>{' '}</H.Icon>
        <H.Icon style={{ background: '#4a4b51', borderRadius: 4, width: 60, height: 16, color: 'transparent' }}>{' '}</H.Icon>
      </H.Icons>
      <H.Description style={{ background: '#4a4b51', borderRadius: 4, width: '80%', height: 60, color: 'transparent' }}>{' '}</H.Description>
    </H.Content>
  </H.Slides>
);

const Hero = () => {
  const { data, isFetched } = useTrendingAnime();
  const items = Array.isArray(data) ? data : [];

  if (!isFetched) {
    return (
      <H.Swiper
        slidesPerView={1}
        pagination={{ clickable: true }}
        direction="horizontal"
        loop={false}
        modules={[Pagination]}
        className="swiper"
      >
        <SkeletonSlide />
      </H.Swiper>
    );
  }

  if (items.length === 0) {
    return (
      <H.Swiper
        slidesPerView={1}
        pagination={{ clickable: true }}
        direction="horizontal"
        loop={false}
        modules={[Pagination]}
        className="swiper"
      >
        <H.Slides>
          <H.Content style={{ width: '100%', textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
            <H.Title style={{ color: '#fff', fontSize: 24 }}>No trending anime available</H.Title>
            <H.Description style={{ color: '#aaa' }}>Check back later for updates.</H.Description>
          </H.Content>
        </H.Slides>
      </H.Swiper>
    );
  }

  return (
    <H.Swiper
      slidesPerView={1}
      pagination={{ clickable: true }}
      direction="horizontal"
      loop={items.length > 1}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      modules={[Pagination]}
      className="swiper"
      navigation={{ nextEl: ".btn-next", prevEl: ".btn-prev" }}
    >
      {items.slice(0, 5).map((item, idx) => (
        <H.Slides key={item.id || idx}>
          <H.ImgContainer>
            <H.Img src={item.coverImage?.large || item.coverImage?.extraLarge || ''} alt={item.title?.english || item.title?.romaji || ''} />
          </H.ImgContainer>
          <H.Content>
            <H.Rank><p>#{idx + 1} Spotlight</p></H.Rank>
            <H.Title>{item.title?.english || item.title?.romaji || item.title?.userPreferred}</H.Title>
            <H.Icons>
              <H.Icon><FaPlayCircle size={12} /> {item.format || 'TV'}</H.Icon>
              <H.Icon><FaClock size={12} /> {item.episodes || '?'} eps</H.Icon>
              {item.averageScore > 0 && <H.IconSpan>HD</H.IconSpan>}
            </H.Icons>
            <H.Description>{(item.description || '').replace(/<[^>]*>/g, '').slice(0, 200)}...</H.Description>
            <H.WatchBtn>
              <H.WatchLink to={`/watch/${item.id}-episode-1`}><FaPlayCircle /> Watch Now</H.WatchLink>
              <H.DetailLink to={`/anime/${item.id}`}>Detail <FaChevronRight size={12} /></H.DetailLink>
            </H.WatchBtn>
          </H.Content>
        </H.Slides>
      ))}
      <div className="btn-prev"><FaChevronLeft /></div>
      <div className="btn-next"><FaChevronRight /></div>
    </H.Swiper>
  );
};

export default Hero;
