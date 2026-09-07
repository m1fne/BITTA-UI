"use client";
import React from 'react';

interface TopSectionProps {
  // Если передаются пропсы клика/навигации, их можно оставить
  onSelect?: (key: string) => void;
}

export default function TopSection({ onSelect }: TopSectionProps) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '20px',
      padding: '16px',
      marginBottom: '16px'
    }}>
      {/* Шапка блока */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🔥</span>
          <span style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>
            TOP
          </span>
        </div>
      </div>

      {/* Содержимое блока (сейчас пустое) */}
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', textAlign: 'center', padding: '12px 0' }}>
        Bu yerga TOP xizmatlarni joylashtirishingiz mumkin
      </div>
    </div>
  );
}