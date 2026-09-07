"use client";
import React, { useState, useEffect } from 'react';

const GRID_SIZE = 15;

interface SnakeGameProps {
  onBack: () => void;
}

export default function SnakeGame({ onBack }: SnakeGameProps) {
  const [snake, setSnake] = useState([{ x: 7, y: 7 }]);
  const [food, setFood] = useState({ x: 3, y: 3 });
  const [dir, setDir] = useState<{ x: number; y: number }>({ x: 0, y: -1 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const generateFood = () => ({
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  });

  const resetGame = () => {
    setSnake([{ x: 7, y: 7 }]);
    setFood(generateFood());
    setDir({ x: 0, y: -1 });
    setScore(0);
    setGameOver(false);
  };

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setSnake((prev) => {
        const head = { x: prev[0].x + dir.x, y: prev[0].y + dir.y };

        if (
          head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE ||
          prev.some((seg) => seg.x === head.x && seg.y === head.y)
        ) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [head, ...prev];
        if (head.x === food.x && head.y === food.y) {
          setScore((s) => s + 10);
          setFood(generateFood());
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, 160);

    return () => clearInterval(timer);
  }, [dir, food, gameOver]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '12px 0', color: '#fff' }}>
      {/* Шапка управления */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '290px' }}>
        <button 
          onClick={onBack} 
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}
        >
          ← Orqaga
        </button>
        <div style={{ fontWeight: '700', fontSize: '16px', color: '#10B981' }}>
          Ochko: {score}
        </div>
      </div>

      {/* Игровое поле */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gap: '2px',
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '8px',
        borderRadius: '16px',
        width: '290px',
        height: '290px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
      }}>
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const isSnake = snake.some((s) => s.x === x && s.y === y);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isFood = food.x === x && food.y === y;

          let bgColor = '#1e293b';
          if (isHead) bgColor = '#10B981';
          else if (isSnake) bgColor = '#34D399';
          else if (isFood) bgColor = '#EC4899';

          return (
            <div key={i} style={{ borderRadius: '3px', background: bgColor, transition: 'background 0.1s' }} />
          );
        })}
      </div>

      {gameOver && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#EF4444', fontWeight: 'bold' }}>O'yin tugadi! 💥</span>
          <button onClick={resetGame} style={{ background: '#10B981', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
            Qayta boshlash 🔄
          </button>
        </div>
      )}

      {/* Кнопки джойстика для телефона */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gap: '8px', marginTop: '6px' }}>
        <div />
        <button onClick={() => dir.y === 0 && setDir({ x: 0, y: -1 })} style={btnStyle}>⬆️</button>
        <div />
        <button onClick={() => dir.x === 0 && setDir({ x: -1, y: 0 })} style={btnStyle}>⬅️</button>
        <button onClick={() => dir.y === 0 && setDir({ x: 0, y: 1 })} style={btnStyle}>⬇️</button>
        <button onClick={() => dir.x === 0 && setDir({ x: 1, y: 0 })} style={btnStyle}>➡️</button>
      </div>
    </div>
  );
}

const btnStyle = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#fff',
  fontSize: '20px',
  padding: '12px',
  borderRadius: '12px',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  userSelect: 'none' as const
};