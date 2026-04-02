'use client';

import { useState } from 'react';
import { DesignSystem } from '@/types';
import ColorSwatch from './ColorSwatch';

interface SiteImage {
  src: string;
  alt?: string;
  type: 'svg' | 'png' | 'jpg' | 'gif' | 'webp';
  inline?: boolean;
}

type Tab = 'tokens' | 'images' | 'inspect';

interface Props {
  data: DesignSystem;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--sasi-muted)' }}>
      {children}
    </p>
  );
}

function Tag({ value }: { value: string }) {
  return (
    <span className="inline-block text-xs font-mono px-3 py-1.5 rounded-lg"
      style={{ background: 'var(--sasi-input-bg)', border: '1px solid var(--sasi-input-border)', color: 'var(--sasi-primary)' }}>
      {value}
    </span>
  );
}

function SectionDivider({ id, title, description }: { id: string; title: string; description?: string }) {
  return (
    <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--sasi-border)' }}>
      <h2 id={id} className="text-base font-semibold scroll-mt-6" style={{ color: 'var(--sasi-navy)' }}>{title}</h2>
      {description && <p className="text-xs mt-0.5" style={{ color: 'var(--sasi-gray)' }}>{description}</p>}
    </div>
  );
}

// ── Image copy helpers ────────────────────────────────────────────────────────

function blobToPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 256;
      canvas.height = img.naturalHeight || 256;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')); };
    img.src = url;
  });
}

function svgToBlob(svgSource: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgSource], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const size = Math.max(img.naturalWidth || 256, img.naturalHeight || 256, 64);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas.getContext('2d')!.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('svg load failed')); };
    img.src = url;
  });
}

// ── Image card with copy + download ──────────────────────────────────────────

function ImageCard({ img, index }: { img: SiteImage; index: number }) {
  const [copied, setCopied] = useState(false);
  const [blocked, setBlocked] = useState(false);

  async function handleCopy() {
    try {
      // Build a blob from the image source
      let blob: Blob;

      if (img.inline) {
        // Inline SVG data URI → render to canvas → PNG blob
        const svgSource = decodeURIComponent(img.src.replace('data:image/svg+xml;charset=utf-8,', ''));
        blob = await svgToBlob(svgSource);
      } else {
        // External URL → proxy fetch to bypass CORS
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(img.src)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('fetch failed');
        const rawBlob = await res.blob();
        // Convert to PNG via canvas so ClipboardItem always gets image/png
        blob = await blobToPng(rawBlob);
      }

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch {
      // Fallback: copy URL as text
      await navigator.clipboard.writeText(img.src);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    if (img.inline) {
      const svgSource = decodeURIComponent(img.src.replace('data:image/svg+xml;charset=utf-8,', ''));
      const blob = new Blob([svgSource], { type: 'image/svg+xml' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `imagem-${index + 1}.svg`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } else {
      const a = document.createElement('a');
      a.href = img.src;
      a.download = img.src.split('/').pop()?.split('?')[0] || `imagem-${index + 1}.${img.type}`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  if (blocked) {
    return (
      <div className="flex flex-col gap-1.5">
        <div
          className="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-2 p-3"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1px dashed rgba(239,68,68,0.3)' }}
        >
          {/* lock icon */}
          <svg className="w-5 h-5 shrink-0" style={{ color: 'rgba(239,68,68,0.5)' }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="7" width="10" height="7" rx="1.5" />
            <path d="M5 7V5a3 3 0 0 1 6 0v2" />
          </svg>
          <p className="text-[9px] text-center leading-snug" style={{ color: 'rgba(239,68,68,0.7)' }}>
            Bloqueada pelo site
          </p>
          {/* copy URL button */}
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(img.src);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            title={copied ? 'Copiado!' : 'Copiar URL'}
            className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md transition-colors"
            style={{ background: 'rgba(239,68,68,0.1)', color: copied ? '#16a34a' : 'rgba(239,68,68,0.8)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {copied ? 'Copiado!' : 'Copiar URL'}
          </button>
        </div>
        <span className="text-[9px] font-mono truncate max-w-full" title={img.src} style={{ color: 'var(--sasi-muted)' }}>
          {img.src.replace(/^https?:\/\//, '').slice(0, 40)}{img.src.length > 50 ? '…' : ''}
        </span>
      </div>
    );
  }

  return (
    <div className="group flex flex-col items-center gap-1.5">
      <div
        className="w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden relative"
        style={{ background: 'var(--sasi-page)', border: '1px solid var(--sasi-border)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.inline ? img.src : `/api/proxy-image?url=${encodeURIComponent(img.src)}`}
          alt={img.alt || img.type}
          className="max-w-full max-h-full object-contain p-2"
          onError={() => setBlocked(true)}
        />

        {/* Action buttons — shown on hover */}
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Copy */}
          <button
            onClick={handleCopy}
            title={copied ? 'Copiado!' : 'Copiar imagem'}
            className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
            style={{ background: 'var(--sasi-content)', border: '1px solid var(--sasi-border)' }}
          >
            {copied ? (
              <svg className="w-3 h-3" style={{ color: '#16a34a' }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8l3.5 3.5L13 4.5" />
              </svg>
            ) : (
              <svg className="w-3 h-3" style={{ color: 'var(--sasi-primary)' }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="5" width="8" height="8" rx="1.5" />
                <path d="M3 11V3.5A.5.5 0 0 1 3.5 3H11" />
              </svg>
            )}
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            title="Baixar"
            className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
            style={{ background: 'var(--sasi-content)', border: '1px solid var(--sasi-border)' }}
          >
            <svg className="w-3 h-3" style={{ color: 'var(--sasi-primary)' }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v8M5 7l3 3 3-3" /><path d="M3 13h10" />
            </svg>
          </button>
        </div>
      </div>

      <span className="text-[9px] font-mono uppercase" style={{ color: 'var(--sasi-muted)' }}>
        {img.inline ? 'svg inline' : img.type}
      </span>
    </div>
  );
}

// ── Images Tab ────────────────────────────────────────────────────────────────

function ImagesTab({ url }: { url: string }) {
  const [images, setImages] = useState<SiteImage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | SiteImage['type']>('all');
  const [fetched, setFetched] = useState(false);

  async function fetchImages() {
    if (fetched) return;
    setFetched(true);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');
      setImages(data.images);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar imagens');
    } finally {
      setLoading(false);
    }
  }

  if (!fetched) fetchImages();

  const filtered = images
    ? filter === 'all' ? images : images.filter(img => img.type === filter)
    : [];

  const types: Array<'all' | SiteImage['type']> = images
    ? ['all', ...new Set(images.map(i => i.type))] as Array<'all' | SiteImage['type']>
    : ['all'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <span className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--sasi-border)', borderTopColor: 'var(--sasi-primary)' }} />
        <p className="text-sm" style={{ color: 'var(--sasi-gray)' }}>Buscando imagens…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-6 mt-6 p-3 rounded-lg text-sm"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>
        {error}
      </div>
    );
  }

  if (images && images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <p className="text-sm font-medium" style={{ color: 'var(--sasi-navy)' }}>Nenhuma imagem encontrada</p>
        <p className="text-xs" style={{ color: 'var(--sasi-gray)' }}>Nenhum asset SVG ou PNG foi detectado nesta página.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-5">
      {images && images.length > 0 && (
        <div className="flex items-center gap-1.5 mb-5 pb-4" style={{ borderBottom: '1px solid var(--sasi-border)' }}>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors"
              style={
                filter === t
                  ? { background: 'var(--sasi-primary)', color: '#fff' }
                  : { background: 'var(--sasi-input-bg)', color: 'var(--sasi-primary)', border: '1px solid var(--sasi-input-border)' }
              }
            >
              {t === 'all'
                ? `Todos (${images.length})`
                : `${t.toUpperCase()} (${images.filter(i => i.type === t).length})`}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {filtered.map((img, i) => (
          <ImageCard key={i} img={img} index={i} />
        ))}
      </div>
    </div>
  );
}

// ── Inspect Tab ───────────────────────────────────────────────────────────────

type InspectSubTab = 'html' | 'css';

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');

  async function copyAll() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--sasi-border)' }}>
      {/* toolbar */}
      <div className="flex items-center justify-between px-4 py-2"
        style={{ background: '#1e2235', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>{language}</span>
        <button onClick={copyAll}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)', color: copied ? '#4ade80' : 'rgba(255,255,255,0.5)' }}>
          {copied ? (
            <><svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l3.5 3.5L13 4.5" /></svg>Copiado</>
          ) : (
            <><svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5" /><path d="M3 11V3.5A.5.5 0 0 1 3.5 3H11" /></svg>Copiar tudo</>
          )}
        </button>
      </div>
      {/* code */}
      <div className="overflow-auto" style={{ background: '#161827', maxHeight: 'calc(100vh - 280px)' }}>
        <table className="w-full border-collapse text-[12px] font-mono">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="select-none text-right px-4 py-0 leading-5 w-12 shrink-0"
                  style={{ color: 'rgba(255,255,255,0.2)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  {i + 1}
                </td>
                <td className="px-4 py-0 leading-5 whitespace-pre" style={{ color: '#cdd6f4' }}>
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InspectTab({ url }: { url: string }) {
  const [data, setData] = useState<{ html: string; css: string; sheetCount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);
  const [subTab, setSubTab] = useState<InspectSubTab>('html');

  async function fetchInspect() {
    if (fetched) return;
    setFetched(true);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro');
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao inspecionar');
    } finally {
      setLoading(false);
    }
  }

  if (!fetched) fetchInspect();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <span className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--sasi-border)', borderTopColor: 'var(--sasi-primary)' }} />
        <p className="text-sm" style={{ color: 'var(--sasi-gray)' }}>Carregando HTML e CSS…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-6 mt-6 p-3 rounded-lg text-sm"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="px-6 py-5">
      {/* sub-tab bar */}
      <div className="flex items-center gap-1 mb-5">
        {(['html', 'css'] as InspectSubTab[]).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wide transition-colors"
            style={
              subTab === t
                ? { background: 'var(--sasi-primary)', color: '#fff' }
                : { background: 'var(--sasi-input-bg)', color: 'var(--sasi-primary)', border: '1px solid var(--sasi-input-border)' }
            }>
            {t === 'css' ? `CSS (${data.sheetCount} folhas)` : 'HTML'}
          </button>
        ))}
        <span className="ml-auto text-[11px]" style={{ color: 'var(--sasi-muted)' }}>
          {subTab === 'html'
            ? `${data.html.split('\n').length.toLocaleString()} linhas`
            : `${data.css.split('\n').length.toLocaleString()} linhas`}
        </span>
      </div>

      <CodeBlock
        key={subTab}
        code={subTab === 'html' ? data.html : data.css}
        language={subTab === 'html' ? 'HTML' : 'CSS'}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DesignSystemDisplay({ data }: Props) {
  const [tab, setTab] = useState<Tab>('tokens');

  const hasTypography = data.fonts.families.length > 0 || data.fonts.sizes.length > 0 || data.fonts.weights.length > 0;
  const hasColors = data.colors.all.length > 0 || data.colors.backgrounds.length > 0 || data.colors.texts.length > 0;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-6 pt-4" style={{ borderBottom: '1px solid var(--sasi-border)' }}>
        {(['tokens', 'images', 'inspect'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="pb-3 px-1 mr-3 text-sm font-medium transition-colors"
            style={
              tab === t
                ? { color: 'var(--sasi-navy)', borderBottom: '2px solid var(--sasi-navy)' }
                : { color: 'var(--sasi-gray)', borderBottom: '2px solid transparent' }
            }
          >
            {t === 'tokens' ? 'Tokens de Design' : t === 'images' ? 'Imagens' : 'Inspecionar'}
          </button>
        ))}
      </div>

      {tab === 'images' && <ImagesTab url={data.url} />}
      {tab === 'inspect' && <InspectTab url={data.url} />}

      {tab === 'tokens' && (
        <div className="px-6 py-6 space-y-12">

          {/* Tipografia */}
          {hasTypography && (
            <section>
              <SectionDivider id="typography" title="Tipografia" description="Famílias, tamanhos e pesos detectados nas folhas de estilo." />
              <div className="space-y-8">
                {data.fonts.families.length > 0 && (
                  <div>
                    <Label>Famílias</Label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {data.fonts.families.map(f => <Tag key={f} value={f} />)}
                    </div>
                    <div className="space-y-2">
                      {data.fonts.families.slice(0, 3).map(f => (
                        <div key={f} className="p-4 rounded-xl"
                          style={{ background: 'var(--sasi-page)', border: '1px solid var(--sasi-border)' }}>
                          <p className="text-[10px] font-mono mb-2" style={{ color: 'var(--sasi-muted)' }}>{f}</p>
                          <p className="text-2xl font-light" style={{ fontFamily: f, color: 'var(--sasi-navy)' }}>
                            The quick brown fox
                          </p>
                          <p className="text-xs mt-1" style={{ fontFamily: f, color: 'var(--sasi-gray)' }}>
                            ABCDEFGHIJKLMNOPQRSTUVWXYZ · abcdefghijklmnopqrstuvwxyz · 0123456789
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.fonts.googleFonts.length > 0 && (
                  <div>
                    <Label>Google Fonts</Label>
                    <div className="flex flex-wrap gap-2">
                      {data.fonts.googleFonts.map(f => (
                        <span key={f} className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgba(57,74,165,0.08)', border: '1px solid rgba(57,74,165,0.2)', color: 'var(--sasi-primary)' }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--sasi-primary)' }} />
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {data.fonts.sizes.length > 0 && (
                  <div>
                    <Label>Tamanhos</Label>
                    <div className="space-y-2">
                      {data.fonts.sizes.slice(0, 12).map(s => (
                        <div key={s} className="flex items-baseline gap-4">
                          <span className="w-14 text-[11px] font-mono shrink-0 text-right" style={{ color: 'var(--sasi-muted)' }}>{s}</span>
                          <span className="font-medium leading-none" style={{ fontSize: `min(${s}, 40px)`, color: 'var(--sasi-navy)' }}>Aa</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.fonts.weights.length > 0 && (
                  <div>
                    <Label>Pesos</Label>
                    <div className="space-y-2">
                      {data.fonts.weights.map(w => (
                        <div key={w} className="flex items-center gap-4">
                          <span className="w-14 text-[11px] font-mono shrink-0 text-right" style={{ color: 'var(--sasi-muted)' }}>{w}</span>
                          <span className="text-base" style={{ fontWeight: w, color: 'var(--sasi-navy)' }}>The quick brown fox</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Cores */}
          {hasColors && (
            <section>
              <SectionDivider id="colors" title="Cores" description="Paleta extraída de propriedades CSS e estilos computados." />
              <div className="space-y-8">
                {data.colors.all.length > 0 && (
                  <div>
                    <Label>Paleta — {data.colors.all.length} cores</Label>
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-3">
                      {data.colors.all.slice(0, 36).map(c => <ColorSwatch key={c} color={c} />)}
                    </div>
                  </div>
                )}
                {data.colors.backgrounds.length > 0 && (
                  <div>
                    <Label>Fundos</Label>
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-3">
                      {data.colors.backgrounds.map(c => <ColorSwatch key={c} color={c} />)}
                    </div>
                  </div>
                )}
                {data.colors.texts.length > 0 && (
                  <div>
                    <Label>Cores de texto</Label>
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-3">
                      {data.colors.texts.map(c => <ColorSwatch key={c} color={c} />)}
                    </div>
                  </div>
                )}
                {data.colors.borders.length > 0 && (
                  <div>
                    <Label>Bordas</Label>
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-3">
                      {data.colors.borders.map(c => <ColorSwatch key={c} color={c} />)}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Espaçamento */}
          {data.spacing.length > 0 && (
            <section>
              <SectionDivider id="spacing" title="Espaçamento" description="Valores usados em padding, margin e gap." />
              <div className="space-y-2">
                {data.spacing.map(s => (
                  <div key={s} className="flex items-center gap-4">
                    <span className="w-16 text-[11px] font-mono shrink-0 text-right" style={{ color: 'var(--sasi-muted)' }}>{s}</span>
                    <div className="h-5 rounded"
                      style={{ width: `min(${s}, 100%)`, minWidth: '4px', background: 'rgba(57,74,165,0.12)', border: '1px solid rgba(57,74,165,0.2)' }} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Borda arredondada */}
          {data.radii.length > 0 && (
            <section>
              <SectionDivider id="border-radius" title="Borda arredondada" description="Valores de border-radius detectados nos elementos." />
              <div className="flex flex-wrap gap-6">
                {data.radii.map(r => (
                  <div key={r} className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14"
                      style={{ borderRadius: r, background: 'var(--sasi-page)', border: '1px solid var(--sasi-input-border)' }} />
                    <span className="text-[11px] font-mono" style={{ color: 'var(--sasi-muted)' }}>{r}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sombras */}
          {data.shadows.length > 0 && (
            <section>
              <SectionDivider id="shadows" title="Sombras" description="Valores de box-shadow usados para criar profundidade e elevação." />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {data.shadows.map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl"
                      style={{ background: 'var(--sasi-content)', boxShadow: s, border: '1px solid var(--sasi-border)' }} />
                    <span className="text-[10px] font-mono text-center line-clamp-2 leading-relaxed" style={{ color: 'var(--sasi-muted)' }}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
