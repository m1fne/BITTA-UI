import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { debugVerifyTelegramInitData } from '@/lib/telegram-auth';

// Данные для карточки "Do'stlarni taklif qilish" в профиле
export async function GET(request: Request) {
  try {
    const initData = request.headers.get('x-telegram-init-data') || '';
    const authResult = debugVerifyTelegramInitData(initData);

    if (!authResult.user) {
      return NextResponse.json({ error: 'Ошибка авторизации' }, { status: 401 });
    }

    const userId = Number(authResult.user.id);
    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: 'Ошибка авторизации' }, { status: 401 });
    }

    const [invitedRes, earnedRes, availableRes] = await Promise.all([
      supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('inviter_id', userId),
      supabase.from('referral_coupons').select('*', { count: 'exact', head: true }).eq('owner_id', userId),
      supabase
        .from('referral_coupons')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .is('used_at', null),
    ]);

    if (invitedRes.error || earnedRes.error || availableRes.error) {
      console.error(
        'Реферал: ошибка чтения:',
        invitedRes.error?.message || earnedRes.error?.message || availableRes.error?.message
      );
      return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invited: invitedRes.count || 0,   // сколько друзей пришло по ссылке
      earned: earnedRes.count || 0,     // сколько друзей купили и дали купон
      available: availableRes.count || 0, // купонов доступно сейчас
      percent: 2,
    });
  } catch (error: any) {
    console.error('Реферал: ошибка:', error?.message || error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}