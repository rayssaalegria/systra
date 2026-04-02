import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const TIMEOUT = 12000;

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/css,text/plain,*/*',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const parsed = new URL(url.startsWith('http') ? url : 'https://' + url);
    const origin = parsed.origin;

    const res = await fetch(parsed.href, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,*/*',
        Referer: origin + '/',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const $ = cheerio.load(html);

    // Collect external stylesheet URLs
    const sheetUrls: string[] = [];
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      if (href.startsWith('http://') || href.startsWith('https://')) {
        sheetUrls.push(href);
      } else if (href.startsWith('//')) {
        sheetUrls.push('https:' + href);
      } else if (href.startsWith('/')) {
        sheetUrls.push(origin + href);
      } else {
        sheetUrls.push(origin + '/' + href);
      }
    });

    // Collect inline <style> blocks
    const inlineStyles: string[] = [];
    $('style').each((_, el) => {
      const text = $(el).text().trim();
      if (text) inlineStyles.push(text);
    });

    // Fetch external sheets in parallel (max 8)
    const sheets = await Promise.all(
      sheetUrls.slice(0, 8).map(async (u) => {
        const content = await fetchText(u);
        return content ? `/* ── ${u} ── */\n${content}` : `/* ── ${u} ── (falhou ao carregar) */`;
      })
    );

    const css = [
      ...sheets,
      ...(inlineStyles.length > 0
        ? [`/* ── estilos inline ── */\n${inlineStyles.join('\n\n')}`]
        : []),
    ].join('\n\n');

    // Return pretty HTML (just the raw source, already readable)
    return NextResponse.json({
      html: html.slice(0, 300_000), // cap at 300 KB
      css: css.slice(0, 500_000),   // cap at 500 KB
      sheetCount: sheetUrls.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao inspecionar';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
