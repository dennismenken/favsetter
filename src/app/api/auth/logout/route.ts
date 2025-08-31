import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const res = NextResponse.json({ success: true });
    res.cookies.delete('auth-token');
    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 