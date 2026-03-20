import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('analyses')
      .select('id, url, result, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
