import { NextRequest, NextResponse } from 'next/server';
import { analyzeUrl } from '@/lib/scraper';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : 'https://' + url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = getSupabase();
    } catch {
      // Supabase not configured — skip cache, just analyze
      const result = await analyzeUrl(parsedUrl.href);
      return NextResponse.json(result);
    }

    // Check Supabase cache (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from('analyses')
      .select('*')
      .eq('url', parsedUrl.href)
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      return NextResponse.json({ ...cached.result, cached: true });
    }

    // Analyze the URL
    const result = await analyzeUrl(parsedUrl.href);

    // Save to Supabase
    await supabase.from('analyses').insert({
      url: parsedUrl.href,
      result,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to analyze URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
