import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { debugVerifyTelegramInitData } from '@/lib/telegram-auth';

// Статус заказа в БД -> статус для экрана истории
function mapOrderStatus(status: string | null): 'approved' | 'rejected' | 'pending' {
  if (status === 'completed') return 'approved';
  if (status === 'refunded' || status === 'failed' || status === 'canceled') return 'rejected';
  return 'pending'; // processing и всё остальное
}

function mapDepositStatus(status: string | null): 'approved' | 'rejected' | 'pending' {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

export async function GET(request: Request) {
  try {
    // 1. Кто спрашивает: берём ID только из проверенных данных Telegram,
    // а не из адреса (иначе любой мог бы смотреть чужую историю).
    const initData = request.headers.get('x-telegram-init-data') || '';
    const authResult = debugVerifyTelegramInitData(initData);

    if (!authResult.user) {
      return NextResponse.json({ error: 'Ошибка авторизации' }, { status: 401 });
    }

    const userId = Number(authResult.user.id);
    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: 'Ошибка авторизации' }, { status: 401 });
    }

    // 2. Покупки (последние 100)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, service, product_name, price, status, target_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (ordersError) {
      console.error('История: ошибка чтения orders:', ordersError.message);
      return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
    }

    // 3. Пополнения (последние 100)
    const { data: deposits, error: depositsError } = await supabase
      .from('deposits')
      .select('id, amount, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (depositsError) {
      console.error('История: ошибка чтения deposits:', depositsError.message);
      return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
    }

    // 4. Единый формат
    const formattedOrders = (orders || []).map((o) => ({
      id: `ord_${o.id}`,
      title: `${(o.service || 'Xizmat').toUpperCase()}: ${o.product_name || ''}`,
      amount: Number(o.price || 0),
      type: 'purchase',
      status: mapOrderStatus(o.status),
      target_id: o.target_id,
      created_at: o.created_at,
    }));

    const formattedDeposits = (deposits || []).map((d) => ({
      id: `dep_${d.id}`,
      title: "Hamyonni to'ldirish",
      amount: Number(d.amount || 0),
      type: 'deposit',
      status: mapDepositStatus(d.status),
      target_id: null,
      created_at: d.created_at,
    }));

    // 5. Объединяем, сначала свежие
    const allHistory = [...formattedOrders, ...formattedDeposits].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ success: true, history: allHistory });
  } catch (error: any) {
    console.error('История: ошибка:', error?.message || error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}