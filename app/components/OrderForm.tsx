'use client';

import { useState } from 'react';

export interface PackageItem {
  id: string;
  name: string;
  price: string;
}

interface OrderFormProps {
  gameKey: string;           // 'pubg', 'freefire', 'mlbb' и т.д.
  gameTitle: string;         // 'PUBG Mobile', 'Free Fire' и т.д.
  packages: PackageItem[];   // Список пакетов
  hasZoneId?: boolean;       // Нужно ли поле Zone ID (для MLBB)
}

export default function OrderForm({ gameKey, gameTitle, packages, hasZoneId = false }: OrderFormProps) {
  const [playerId, setPlayerId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId || !selectedPackage) {
      setStatus({ type: 'error', msg: 'Заполните ID и выберите товар!' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/orders/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameKey,
          playerId: playerId.trim(),
          zoneId: hasZoneId ? zoneId.trim() : undefined,
          variationId: selectedPackage,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus({ type: 'success', msg: '✅ Пополнение успешно выполнено!' });
        setPlayerId('');
        setZoneId('');
      } else {
        setStatus({
          type: 'error',
          msg: `❌ Ошибка: ${data.details?.message || data.error || 'Не удалось выполнить донат'}`,
        });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: '❌ Ошибка соединения с сервером.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#181920', color: '#fff', borderRadius: '16px' }}>
      <h3 style={{ marginTop: 0 }}>{gameTitle}</h3>

      <form onSubmit={handleSubmit}>
        {/* Поле ID игрока */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '4px' }}>
            ID Игрока / Аккаунта
          </label>
          <input
            type="text"
            placeholder="Введите ID"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #333',
              background: '#0d0f12',
              color: '#fff',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Дополнительное поле Zone ID для игр вроде Mobile Legends */}
        {hasZoneId && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '4px' }}>
              Zone ID
            </label>
            <input
              type="text"
              placeholder="Введите Zone ID"
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #333',
                background: '#0d0f12',
                color: '#fff',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* Выбор пакета */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '8px' }}>
            Выберите вариант
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: selectedPackage === pkg.id ? '2px solid #8b5cf6' : '1px solid #2d323e',
                  background: selectedPackage === pkg.id ? '#25213b' : '#111318',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{pkg.name}</div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>{pkg.price}</div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: loading ? '#555' : '#8b5cf6',
            color: '#fff',
            fontWeight: 'bold',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Обработка...' : 'Купить'}
        </button>
      </form>

      {status && (
        <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', fontSize: '13px', background: status.type === 'success' ? '#14532d' : '#7f1d1d' }}>
          {status.msg}
        </div>
      )}
    </div>
  );
}