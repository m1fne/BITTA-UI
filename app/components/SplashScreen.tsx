'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Таймер имитирует загрузку / инициализацию WebApp (1.2 секунды)
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 400); // Время анимации исчезновения
      return () => clearTimeout(removeTimer);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090d16] transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Желейный контейнер по центру */}
      <div className="flex flex-col items-center animate-jelly">
        {/* Маленький элемент сверху (например, цифра 1) */}
        <span className="text-[11px] font-black tracking-widest text-indigo-400 uppercase mb-1.5 opacity-90 drop-shadow-sm">
          1
        </span>

        {/* Основной значок с буквой B */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 text-white text-4xl font-black border border-white/10">
          B
        </div>

        {/* Название бренда снизу */}
        <span className="mt-4 text-xs font-bold tracking-[0.25em] text-slate-400 uppercase">
          BittaHub
        </span>
      </div>

      {/* Инъекция стилей с физикой "желе / холодца" */}
      <style jsx global>{`
        @keyframes jelly {
          0% {
            transform: scale(0.4);
            opacity: 0;
          }
          45% {
            transform: scale(1.15);
            opacity: 1;
          }
          65% {
            transform: scale(0.92);
          }
          80% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-jelly {
          animation: jelly 0.85s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
      `}</style>
    </div>
  );
}