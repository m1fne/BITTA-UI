"use client";
import React from 'react';

// Тексты на латинице
const TOP_DATA = {
  badge: "✨ TOP",
  title: "Eng foydali xizmatlar",
  description: "Oylik eng ommabop bo'limlar, PUBG, Steam va maxsus bonuslar",
  icon: "🔥",
  link: "#"
};

export default function TopSection() {
  return (
    <div style={styles.card} onClick={() => console.log('Top clicked')}>
      <div style={styles.badge}>{TOP_DATA.badge}</div>
      <div style={styles.content}>
        <div style={styles.iconBox}>
          <span style={styles.icon}>{TOP_DATA.icon}</span>
        </div>
        <div style={styles.info}>
          <h3 style={styles.title}>{TOP_DATA.title}</h3>
          <p style={styles.desc}>{TOP_DATA.description}</p>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.15) 0%, rgba(147, 51, 234, 0.25) 100%)',
    border: '1px solid rgba(255, 138, 0, 0.5)',
    borderRadius: '24px',
    padding: '20px 18px', // Увеличили отступы, чтобы карточка стала выше и квадратнее
    marginBottom: '16px',
    backdropFilter: 'blur(12px)',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(255, 107, 0, 0.15)'
  },
  badge: {
    position: 'absolute',
    top: '-11px',
    left: '20px',
    background: 'linear-gradient(90deg, #FF8A00 0%, #FF005C 100%)',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 800,
    padding: '4px 12px',
    borderRadius: '14px',
    letterSpacing: '0.6px',
    boxShadow: '0 4px 12px rgba(255, 0, 92, 0.4)'
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  iconBox: {
    width: '56px', // Более крупный квадратный блок под иконку
    height: '56px',
    background: 'linear-gradient(135deg, #FF8A00 0%, #FF005C 100%)',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 15px rgba(255, 138, 0, 0.3)'
  },
  icon: {
    fontSize: '26px'
  },
  info: {
    flexGrow: 1
  },
  title: {
    color: '#ffffff',
    fontSize: '17px',
    fontWeight: 700,
    margin: '0 0 6px 0',
    lineHeight: '1.2'
  },
  desc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '13px',
    margin: 0,
    lineHeight: '1.4'
  }
};