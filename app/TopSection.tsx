"use client";
import React from 'react';

// Список сервисов-кубиков (как приложения на смартфоне)
const APPS = [
  { id: 'pubg', title: 'PUBG UC', icon: '🎮', bg: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)', badge: 'HOT' },
  { id: 'tg', title: 'TG Premium', icon: '⭐', bg: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', badge: 'SALE' },
  { id: 'steam', title: 'Steam', icon: '💨', bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', badge: '' },
  { id: 'cefr', title: 'CEFR / IELTS', icon: '🎓', bg: 'linear-gradient(135deg, #8A2387 0%, #E94057 100%)', badge: '' },
  { id: 'jobs', title: 'Vakansiya', icon: '💼', bg: 'linear-gradient(135deg, #FF8A00 0%, #FF005C 100%)', badge: 'NEW' },
  { id: 'ai', title: 'Bitta AI', icon: '🤖', bg: 'linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)', badge: 'PRO' },
];

export default function TopSection() {
  return (
    <div style={styles.board}>
      {/* Шапка доски */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>⚡ Tezkor xizmatlar</h2>
          <p style={styles.subtitle}>Eng ko'p ishlatiladigan bo'limlar</p>
        </div>
        <div style={styles.liveBadge}>● TOP 6</div>
      </div>

      {/* Сетка кубиков (Grid 3x2) */}
      <div style={styles.grid}>
        {APPS.map((app) => (
          <div 
            key={app.id} 
            style={styles.appCard} 
            onClick={() => console.log('Open:', app.title)}
          >
            <div style={{ ...styles.iconBox, background: app.bg }}>
              <span style={styles.icon}>{app.icon}</span>
              {app.badge && <span style={styles.appBadge}>{app.badge}</span>}
            </div>
            <span style={styles.appTitle}>{app.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  board: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '28px',
    padding: '20px 16px',
    marginBottom: '20px',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '0 4px',
  },
  title: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.3px',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '12px',
    margin: '2px 0 0 0',
  },
  liveBadge: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#00FF66',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)', // 3 кубика в ряд
    gap: '12px',
  },
  appCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '20px',
    padding: '12px 8px',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, background 0.15s ease',
  },
  iconBox: {
    position: 'relative',
    width: '52px',
    height: '52px',
    borderRadius: '16px', // Форма иконки приложения iOS
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
  },
  icon: {
    fontSize: '24px',
  },
  appBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    background: '#FF005C',
    color: '#fff',
    fontSize: '8px',
    fontWeight: 900,
    padding: '2px 5px',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
  },
  appTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '12px',
    fontWeight: 600,
    textAlign: 'center',
    lineHeight: '1.2',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
};