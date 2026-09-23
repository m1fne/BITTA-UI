"use client";
import React from 'react';

interface TopSectionProps {
  onSelect?: (key: string) => void;
}

export default function TopSection({ onSelect }: TopSectionProps) {
  return (
    <div 
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        padding: '12px 14px',
        marginBottom: '14px',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Компактный заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <span style={{ fontSize: '15px' }}>🔥</span>
        <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '700' }}>
          TOP
        </span>
      </div>

      {/* Контейнер для карточек */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        
        {/* Аккуратный кубик PUBG */}
        <button 
          className="bt-tile"
          onClick={() => onSelect?.("pubg")}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '6px',
            width: '88px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <img 
            src="/pubg_mobile.jpg" 
            alt="PUBG Mobile" 
            style={{ 
              width: '100%', 
              height: '76px', 
              objectFit: 'cover', 
              borderRadius: '10px', 
              marginBottom: '5px' 
            }} 
          />
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#FFFFFF', lineHeight: '1.1' }}>
            PUBG Mobile
          </span>
          <span style={{ fontSize: '8px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
            UC to'ldirish
          </span>
        </button>

      </div>
    </div>
  );
}