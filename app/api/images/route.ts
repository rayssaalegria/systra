import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export interface SiteImage {
  src: string;
  alt?: string;
  type: 'svg' | 'png' | 'jpg' | 'gif' | 'webp';
  inline?: boolean;
}

const TIMEOUT = 10000;

function toAbsolute(href: string, origin: string): string {
  if (!href || href.startsWith('data:')) return '';
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (href.startsWith('//')) return 'https:' + href;
  if (href.startsWith('/')) return origin + href;
  return origin + '/' + href;
}

function getType(src: string): SiteImage['type'] | null {
  const lower = src.toLowerCase().split('?')[0].split('#')[0];
  if (lower.endsWith('.svg')) return 'svg';
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'jpg';
  if (lower.endsWith('.gif')) return 'gif';
  if (lower.endsWith('.webp')) return 'webp';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const parsedUrl = new URL(url.startsWith('http') ? url : 'https://' + url);
    const origin = parsedUrl.origin;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    let html: string;
    try {
      const res = await fetch(parsedUrl.href, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Systra/1.0)',
          Accept: 'text/html,*/*',
        },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } finally {
      clearTimeout(timer);
    }

    const $ = cheerio.load(html);
    const images: SiteImage[] = [];
    const seen = new Set<string>();

    // 1. <img> tags
    $('img[src], img[data-src]').each((_, el) => {
      const raw = $(el).attr('src') || $(el).attr('data-src') || '';
      const alt = $(el).attr('alt') || '';
      const abs = toAbsolute(raw, origin);
      if (!abs || seen.has(abs)) return;
      const type = getType(abs);
      if (!type) return;
      seen.add(abs);
      images.push({ src: abs, alt, type });
    });

    // 2. Inline <svg> elements
    $('svg').each((_, el) => {
      // Skip tiny/hidden SVGs (icons)
      const w = parseInt($(el).attr('width') || '0');
      const h = parseInt($(el).attr('height') || '0');
      if ((w > 0 && w < 24) || (h > 0 && h < 24)) return;

      const svgHtml = $.html(el);
      if (svgHtml.length > 80000) return; // skip huge blobs
      const key = svgHtml.slice(0, 100);
      if (seen.has(key)) return;
      seen.add(key);
      const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgHtml)}`;
      images.push({ src: dataUri, type: 'svg', inline: true });
    });

    // 3. Background-image URLs in <style> tags
    const bgRegex = /url\(['"]?([^'")]+\.(?:svg|png|jpg|jpeg|gif|webp))['"]?\)/gi;
    $('style').each((_, el) => {
      const css = $(el).text();
      let match;
      while ((match = bgRegex.exec(css)) !== null) {
        const abs = toAbsolute(match[1], origin);
        if (!abs || seen.has(abs)) continue;
        const type = getType(abs);
        if (!type) continue;
        seen.add(abs);
        images.push({ src: abs, type });
      }
    });

    return NextResponse.json({ images: images.slice(0, 80) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch images';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
