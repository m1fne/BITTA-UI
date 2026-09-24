import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.payerpin.uz/api/v2/catalog', {
      headers: {
        'X-API-Key': process.env.PAYERPIN_API_KEY || '',
      },
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}