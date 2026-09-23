"use client";
import React, { useState, useEffect } from 'react';

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: number;
}

interface TangaProps {
  onBack?: () => void;
}

export default function TangaGame({ onBack }: TangaProps) {
  // Состояния игрока
  const [balance, setBalance] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(100);
  const [maxEnergy, setMaxEnergy] = useState<number>(100);
  const [tapPower, setTapPower] = useState<number>(1);
  
  // Цены апгрейдов
  const [multitapCost, setMultitapCost] = useState<number>(150);
  const [energyCost, setEnergyCost] = useState<number>(200);

  // Анимации
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isPressed, setIsPressed] = useState<boolean>(false);

  // Регенерация энергии (+1 каждые 2 секунды)
  useEffect(() => {
    const timer = setInterval(() => {
      setEnergy((prev) => Math.min(prev + 1, maxEnergy));
    }, 2000);
    return () => clearInterval(timer);
  }, [maxEnergy]);

  // Клик по монете
  const handleTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (energy < tapPower) return;

    setEnergy((prev) => Math.max(0, prev - tapPower));
    setBalance((prev) => prev + tapPower);

    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 80);

    const rect = e.currentTarget.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newText: FloatingText = {
      id: Date.now() + Math.random(),
      x,
      y,
      value: tapPower
    };

    setFloatingTexts((prev) => [...prev, newText]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== newText.id));
    }, 800);
  };

  const buyMultitap = () => {
    if (balance >= multitapCost) {
      setBalance((prev) => prev - multitapCost);
      setTapPower((prev) => prev + 1);
      setMultitapCost((prev) => Math.floor(prev * 2.5));
    }
  };

  const buyEnergyTank = () => {
    if (balance >= energyCost) {
      setBalance((prev) => prev - energyCost);
      setMaxEnergy((prev) => prev + 50);
      setEnergy((prev) => prev + 50);
      setEnergyCost((prev) => Math.floor(prev * 2.2));
    }
  };

  return (
    <div style={{
      background: 'rgba(18, 18, 28, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '24px',
      padding: '20px',
      color: '#FFF',
      maxWidth: '400px',
      margin: '0 auto',
      boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
      userSelect: 'none'
    }}>
      {/* Кнопка Назад */}
      {onBack && (
        <button 
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#FFF',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          ← Orqaga
        </button>
      )}

      {/* Баланс */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '600' }}>
          TANGA BALANCE
        </div>
        <div style={{ fontSize: '36px', fontWeight: '900', color: '#FFB800', letterSpacing: '1px' }}>
          🪙 {balance.toLocaleString()}
        </div>
      </div>

      {/* Монета с картинкой tanga.png */}
      <div 
        onClick={handleTap}
        onTouchStart={handleTap}
        style={{
          position: 'relative',
          width: '180px',
          height: '180px',
          margin: '0 auto 24px auto',
          borderRadius: '50%',
          boxShadow: energy >= tapPower 
            ? '0 0 35px rgba(255, 184, 0, 0.4)'
            : '0 0 15px rgba(100, 100, 100, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: energy >= tapPower ? 'pointer' : 'not-allowed',
          transform: isPressed ? 'scale(0.93)' : 'scale(1)',
          transition: 'transform 0.08s ease',
          opacity: energy < tapPower ? 0.6 : 1,
          overflow: 'hidden'
        }}
      >
        <img 
          src="/tanga.png" 
          alt="Tanga" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} 
        />

        {floatingTexts.map((item) => (
          <span
            key={item.id}
            style={{
              position: 'absolute',
              left: `${item.x}px`,
              top: `${item.y}px`,
              fontSize: '22px',
              fontWeight: '900',
              color: '#FFF',
              textShadow: '0 2px 6px rgba(0,0,0,0.9)',
              pointerEvents: 'none',
              animation: 'floatUp 0.8s ease-out forwards'
            }}
          >
            +{item.value}
          </span>
        ))}
      </div>

      {/* Шкала энергии */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>⚡ Энергия</span>
          <span style={{ fontWeight: '700' }}>{energy} / {maxEnergy}</span>
        </div>
        <div style={{
          width: '100%',
          height: '10px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(energy / maxEnergy) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #FFB800, #FF3D00)',
            transition: 'width 0.2s ease',
            borderRadius: '10px'
          }} />
        </div>
      </div>

      {/* Апгрейды */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>
          Апгрейды
        </div>

        <button
          onClick={buyMultitap}
          disabled={balance < multitapCost}
          style={{
            padding: '12px 16px',
            borderRadius: '14px',
            background: balance >= multitapCost ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#FFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: balance >= multitapCost ? 'pointer' : 'not-allowed',
            opacity: balance >= multitapCost ? 1 : 0.4
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>🖐️ Multitap (+1 к клику)</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Текущая сила: +{tapPower}</div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#FFB800' }}>
            🪙 {multitapCost}
          </div>
        </button>

        <button
          onClick={buyEnergyTank}
          disabled={balance < energyCost}
          style={{
            padding: '12px 16px',
            borderRadius: '14px',
            background: balance >= energyCost ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#FFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: balance >= energyCost ? 'pointer' : 'not-allowed',
            opacity: balance >= energyCost ? 1 : 0.4
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>🔋 Запас энергии (+50)</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Макс: {maxEnergy}</div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#FFB800' }}>
            🪙 {energyCost}
          </div>
        </button>
      </div>

      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px) scale(1.3);
          }
        }
      `}</style>
    </div>
  );
}