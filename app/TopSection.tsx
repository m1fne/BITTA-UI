import React from 'react';

// Замени эти данные на актуальные полезные функции этого месяца
const TOP_DATA = {
  badge: "TOP",
  title: "Энг фойдали хизматлар",
  description: "Ойнинг энг оммабоп бўлимлари ва бонуслари",
  icon: "🔥",
  link: "#" // Ссылка на нужную страницу/функцию
};

export default function TopSection() {
  return (
    <div style={styles.card} onClick={() => console.log('Top clicked')}>
      <div style={styles.badge}>{TOP_DATA.badge}</div>
      <div style={styles.content}>
        <div style={styles.icon}>{TOP_DATA.icon}</div>
        <div style={styles.info}>
          <h3 style={styles.title}>{TOP_DATA.title}</h3>
          <p style={styles.desc}>{TOP_DATA.description}</p>
        </div>
        <div style={styles.arrow}>›</div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)',
    border: '1px solid rgba(255, 138, 0, 0.45)',
    borderRadius: '20px',
    padding: '16px',
    marginBottom: '12px',
    backdropFilter: 'blur(10px)',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
  },
  badge: {
    position: 'absolute',
    top: '-10px',
    left: '16px',
    background: 'linear-gradient(90deg, #FF8A00 0%, #FF005C 100%)',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 800,
    padding: '3px 10px',
    borderRadius: '12px',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 8px rgba(255, 0, 92, 0.4)'
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  icon: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #FF8A00, #FF005C)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    flexShrink: 0
  },
  info: {
    flexGrow: 1
  },
  title: {
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 700,
    margin: '0 0 4px 0'
  },
  desc: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: '12px',
    margin: 0
  },
  arrow: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '22px'
  }
};