import * as cheerio from 'cheerio';
import { DesignSystem } from '@/types';

const TIMEOUT = 10000;

function extractColors(css: string): { all: string[]; backgrounds: string[]; texts: string[]; borders: string[] } {
  const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;
  const rgbRegex = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g;
  const hslRegex = /hsla?\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%(?:\s*,\s*[\d.]+)?\s*\)/g;

  const all = new Set<string>();
  const backgrounds = new Set<string>();
  const texts = new Set<string>();
  const borders = new Set<string>();

  const lines = css.split('\n');

  for (const line of lines) {
    const colorMatches = [...(line.match(hexRegex) || []), ...(line.match(rgbRegex) || []), ...(line.match(hslRegex) || [])];
    const isBackground = /background(-color)?:/.test(line);
    const isText = /(?:^|\s)color:/.test(line);
    const isBorder = /border(-color|-top|-right|-bottom|-left)?:/.test(line);

    for (const color of colorMatches) {
      const normalized = color.toLowerCase();
      // Skip very dark/light single chars and irrelevant colors
      if (normalized === '#000' || normalized === '#fff' || normalized === '#000000' || normalized === '#ffffff') continue;
      all.add(normalized);
      if (isBackground) backgrounds.add(normalized);
      if (isText) texts.add(normalized);
      if (isBorder) borders.add(normalized);
    }
  }

  return {
    all: [...all].slice(0, 40),
    backgrounds: [...backgrounds].slice(0, 20),
    texts: [...texts].slice(0, 20),
    borders: [...borders].slice(0, 10),
  };
}

function extractFonts(css: string, $: cheerio.CheerioAPI) {
  const familyRegex = /font-family\s*:\s*([^;{}]+)/gi;
  const sizeRegex = /font-size\s*:\s*([^;{}]+)/gi;
  const weightRegex = /font-weight\s*:\s*([^;{}]+)/gi;

  const families = new Set<string>();
  const sizes = new Set<string>();
  const weights = new Set<string>();
  const googleFonts: string[] = [];

  // Extract from CSS
  let match;
  while ((match = familyRegex.exec(css)) !== null) {
    const raw = match[1].trim().replace(/!important/gi, '').trim();
    const fonts = raw.split(',').map(f => f.trim().replace(/['"]/g, '').trim());
    for (const font of fonts) {
      if (font && !['sans-serif', 'serif', 'monospace', 'inherit', 'initial', 'unset', 'cursive', 'fantasy'].includes(font.toLowerCase())) {
        families.add(font);
      }
    }
  }

  while ((match = sizeRegex.exec(css)) !== null) {
    const val = match[1].trim().replace(/!important/gi, '').trim();
    if (/^[\d.]+(?:px|rem|em|pt|vh|vw)$/.test(val)) sizes.add(val);
  }

  while ((match = weightRegex.exec(css)) !== null) {
    const val = match[1].trim().replace(/!important/gi, '').trim();
    if (/^[0-9]{3}$|^(?:bold|normal|lighter|bolder)$/.test(val)) weights.add(val);
  }

  // Detect Google Fonts from <link> tags
  $('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const familiesMatch = href.match(/family=([^&]+)/);
    if (familiesMatch) {
      const names = decodeURIComponent(familiesMatch[1])
        .split('|')
        .map(f => f.split(':')[0].replace(/\+/g, ' '));
      googleFonts.push(...names);
      names.forEach(n => families.add(n));
    }
  });

  // Also check @import in CSS for Google Fonts
  const importRegex = /@import\s+url\(['"](https?:\/\/fonts\.googleapis\.com[^'"]*)['"]\)/gi;
  while ((match = importRegex.exec(css)) !== null) {
    const familiesMatch = match[1].match(/family=([^&]+)/);
    if (familiesMatch) {
      const names = decodeURIComponent(familiesMatch[1])
        .split('|')
        .map(f => f.split(':')[0].replace(/\+/g, ' '));
      googleFonts.push(...names);
      names.forEach(n => families.add(n));
    }
  }

  return {
    families: [...families].slice(0, 15),
    sizes: [...sizes].sort((a, b) => parseFloat(a) - parseFloat(b)).slice(0, 15),
    weights: [...weights].sort().slice(0, 10),
    googleFonts: [...new Set(googleFonts)],
  };
}

function extractRadii(css: string): string[] {
  const radiiRegex = /border-radius\s*:\s*([^;{}]+)/gi;
  const radii = new Set<string>();
  let match;
  while ((match = radiiRegex.exec(css)) !== null) {
    const val = match[1].trim().replace(/!important/gi, '').trim();
    if (/^[\d.]+(?:px|rem|em|%|vh|vw)/.test(val)) radii.add(val);
  }
  return [...radii].slice(0, 10);
}

function extractShadows(css: string): string[] {
  const shadowRegex = /box-shadow\s*:\s*([^;{}]+)/gi;
  const shadows = new Set<string>();
  let match;
  while ((match = shadowRegex.exec(css)) !== null) {
    const val = match[1].trim().replace(/!important/gi, '').trim();
    if (val !== 'none' && val !== 'inherit') shadows.add(val);
  }
  return [...shadows].slice(0, 8);
}

function extractSpacing(css: string): string[] {
  const spacingRegex = /(?:padding|margin|gap)\s*:\s*([^;{}]+)/gi;
  const values = new Set<string>();
  let match;
  while ((match = spacingRegex.exec(css)) !== null) {
    const parts = match[1].trim().replace(/!important/gi, '').trim().split(/\s+/);
    for (const part of parts) {
      if (/^[\d.]+(?:px|rem|em)$/.test(part) && part !== '0px' && part !== '0rem') {
        values.add(part);
      }
    }
  }
  return [...values].sort((a, b) => parseFloat(a) - parseFloat(b)).slice(0, 15);
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Systra/1.0; +https://systra.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function analyzeUrl(inputUrl: string): Promise<DesignSystem> {
  // Normalize URL
  let url = inputUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname;
  const origin = parsedUrl.origin;

  // Fetch the main HTML
  const htmlRes = await fetchWithTimeout(url);
  if (!htmlRes.ok) throw new Error(`Failed to fetch ${url}: ${htmlRes.status}`);
  const html = await htmlRes.text();

  const $ = cheerio.load(html);

  // Collect all CSS
  let allCss = '';

  // Inline <style> tags
  $('style').each((_, el) => {
    allCss += $(el).text() + '\n';
  });

  // Fetch external stylesheets (limit to 5)
  const cssLinks: string[] = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.includes('fonts.googleapis') && !href.includes('fonts.gstatic')) {
      const fullUrl = href.startsWith('http') ? href : href.startsWith('//') ? 'https:' + href : `${origin}${href.startsWith('/') ? '' : '/'}${href}`;
      cssLinks.push(fullUrl);
    }
  });

  const cssResults = await Promise.allSettled(
    cssLinks.slice(0, 5).map(async (cssUrl) => {
      const res = await fetchWithTimeout(cssUrl);
      return res.ok ? res.text() : '';
    })
  );

  for (const result of cssResults) {
    if (result.status === 'fulfilled') allCss += result.value + '\n';
  }

  // Also check for favicon
  let favicon = `${origin}/favicon.ico`;
  const faviconEl = $('link[rel*="icon"]').first().attr('href');
  if (faviconEl) {
    favicon = faviconEl.startsWith('http') ? faviconEl : `${origin}${faviconEl.startsWith('/') ? '' : '/'}${faviconEl}`;
  }

  // Extract all design tokens
  const fonts = extractFonts(allCss, $);
  const colors = extractColors(allCss);
  const radii = extractRadii(allCss);
  const shadows = extractShadows(allCss);
  const spacing = extractSpacing(allCss);

  return {
    url,
    domain,
    favicon,
    fonts,
    colors,
    radii,
    shadows,
    spacing,
    analyzedAt: new Date().toISOString(),
  };
}
