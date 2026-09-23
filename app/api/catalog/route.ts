import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.payerpin.uz/api/v2/catalog', {
      headers: {
        'X-API-Key': process.env.PAYERPIN_API_KEY || '',
      },
      // Кешируем список на 1 час (3600 сек), чтобы не спамить API
      next: { revalidate: 3600 },
    });

    const body = await response.json();

    if (!body.ok) {
      return NextResponse.json(
        { error: body.error?.code || 'Ошибка каталога' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: body.data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}