'use client';

import { useState, useEffect } from 'react';

const BANNERS = [
  { id: 1, src: '/banner1.jpg', alt: 'PUBG Mobile ARZON UC' },
  { id: 2, src: '/banner2.jpg', alt: 'Free Fire ARZON ALMOSLAR' },
];

export default function Banner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '420px', // Ограничение по ширине телефона
      margin: '12px auto',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    }}>
      {/* Слайдер */}
      <div style={{
        display: 'flex',
        width: '100%',
        transition: 'transform 0.4s ease-in-out',
        transform: `translateX(-${currentIndex * 100}%)`,
      }}>
        {BANNERS.map((banner) => (
          <div 
            key={banner.id} 
            style={{
              minWidth: '100%',
              height: '150px', // ЖЕСТКАЯ ВЫСОТА
              position: 'relative',
            }}
          >
            <img 
              src={banner.src} 
              alt={banner.alt} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
          </div>
        ))}
      </div>

      {/* Точки снизу */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '6px',
        background: 'rgba(0, 0, 0, 0.6)',
        padding: '4px 10px',
        borderRadius: '20px',
        backdropFilter: 'blur(4px)',
        zIndex: 10,
      }}>
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            style={{
              width: currentIndex === index ? '18px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: currentIndex === index ? '#FBBF24' : 'rgba(255, 255, 255, 0.4)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}