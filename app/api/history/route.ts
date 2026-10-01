import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
      return NextResponse.json({ error: 'Telegram ID обязателен' }, { status: 400 });
    }

    const userId = Number(telegramId);

    // 1. Получаем покупки из orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId);

    // 2. Получаем пополнения из deposits
    const { data: deposits } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', userId);

    // 3. Приводим покупки к единому формату
    const formattedOrders = (orders || []).map((o) => ({
      id: `ord_${o.id}`,
      title: `${(o.service || 'Xizmat').toUpperCase()}: ${o.product_name || ''}`,
      amount: Number(o.price || 0),
      type: 'purchase',
      status: o.status === 'completed' ? 'approved' : o.status === 'failed' ? 'rejected' : 'pending',
      target_id: o.target_id,
      created_at: o.created_at,
    }));

    // 4. Приводим депозиты к единому формату
    const formattedDeposits = (deposits || []).map((d) => ({
      id: `dep_${d.id}`,
      title: "Hamyonni to'ldirish",
      amount: Number(d.amount || 0),
      type: 'deposit',
      status: d.status === 'approved' ? 'approved' : d.status === 'rejected' ? 'rejected' : 'pending',
      target_id: null,
      created_at: d.created_at,
    }));

    // 5. Объединяем и сортируем по дате (сначала свежие)
    const allHistory = [...formattedOrders, ...formattedDeposits].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ success: true, history: allHistory });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}