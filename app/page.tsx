'use client';

import { useState } from 'react';
import { DesignSystem } from '@/types';
import DesignSystemDisplay from '@/components/DesignSystemDisplay';

const SECTIONS = [
  { id: 'typography', label: 'Tipografia' },
  { id: 'colors', label: 'Cores' },
  { id: 'spacing', label: 'Espaçamento' },
  { id: 'border-radius', label: 'Borda arredondada' },
  { id: 'shadows', label: 'Sombras' },
];

function IconSearch({ cls }: { cls?: string }) {
  return (
    <svg className={cls ?? 'w-4 h-4 shrink-0'} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5l2.5 2.5" />
    </svg>
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DesignSystem | null>(null);
  const [error, setError] = useState('');

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao analisar');
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  const hasSections = result && (
    result.fonts.families.length > 0 ||
    result.colors.all.length > 0 ||
    result.spacing.length > 0 ||
    result.radii.length > 0 ||
    result.shadows.length > 0
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--sasi-page)' }}>

      {/* ── Sidebar ───────────────────────────────── */}
      <aside className="w-[220px] shrink-0 flex flex-col justify-between" style={{ background: 'var(--sasi-sidebar)' }}>
        <div className="flex flex-col">
          {/* Brand */}
          <div className="flex items-center justify-center px-3 h-[76px] shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Systra" className="w-full object-contain" style={{ maxHeight: '68px' }} />
          </div>

          {/* Nav */}
          <nav className="flex flex-col">
            <button
              className="flex items-center gap-2.5 px-4 h-14 text-sm font-medium text-left w-full"
              style={{ color: 'var(--sasi-primary)' }}
            >
              <IconSearch />
              Analisador
            </button>
          </nav>

          {/* Token section links — only when result loaded */}
          {hasSections && (
            <div className="mt-1" style={{ borderTop: '1px solid var(--sasi-border)' }}>
              <p className="px-4 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--sasi-muted)' }}>
                Tokens
              </p>
              <nav className="flex flex-col">
                {SECTIONS.filter(s => {
                  if (s.id === 'typography') return result!.fonts.families.length > 0 || result!.fonts.sizes.length > 0;
                  if (s.id === 'colors') return result!.colors.all.length > 0;
                  if (s.id === 'spacing') return result!.spacing.length > 0;
                  if (s.id === 'border-radius') return result!.radii.length > 0;
                  if (s.id === 'shadows') return result!.shadows.length > 0;
                  return false;
                }).map(s => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2.5 px-4 h-9 text-sm font-medium hover:bg-white/30 transition-colors"
                    style={{ color: 'var(--sasi-primary)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--sasi-primary)' }} />
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--sasi-border)' }}>
          <p className="text-[10px]" style={{ color: 'var(--sasi-muted)' }}>v1.0 · Extrator de Design System</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--sasi-primary)' }}>by Rayssa Alegria</p>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col pr-2 pb-2 min-w-0">

        {/* Header — only when result is loaded */}
        {result && (
          <div
            className="shrink-0 flex items-center justify-between px-6 h-[76px]"
            style={{
              background: 'var(--sasi-content)',
              borderRadius: '8px 8px 0 0',
              borderBottom: '1px solid var(--sasi-border)',
            }}
          >
            <div className="min-w-0 mr-4">
              <div className="flex items-center gap-2">
                {result.favicon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.favicon} alt="" className="w-5 h-5 rounded shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <h1 className="text-xl font-bold leading-none truncate" style={{ color: 'var(--sasi-navy)' }}>
                  {result.domain}
                </h1>
              </div>
              <a href={result.url} target="_blank" rel="noopener noreferrer"
                className="text-[11px] mt-0.5 block hover:underline truncate max-w-sm"
                style={{ color: 'var(--sasi-gray)' }}>
                {result.url}
              </a>
            </div>

            {/* Compact search in header when result shown */}
            <form onSubmit={handleAnalyze} className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 h-8 px-3 rounded-lg"
                style={{ background: 'var(--sasi-input-bg)', border: '1px solid var(--sasi-input-border)', minWidth: '240px' }}>
                <IconSearch cls="w-3.5 h-3.5 shrink-0" />
                <input type="text" value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="Nova URL..." className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: 'var(--sasi-navy)' }} disabled={loading} />
              </div>
              <button type="submit" disabled={loading || !url.trim()}
                className="h-8 px-4 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                style={{ background: 'var(--sasi-primary)' }}>
                {loading
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analisando</>
                  : 'Analisar'}
              </button>
            </form>
          </div>
        )}

        {/* Content area */}
        <div
          className="flex-1 overflow-y-auto min-h-0"
          style={{
            background: 'var(--sasi-content)',
            borderRadius: result ? '0 0 8px 8px' : '8px',
          }}
        >
          {/* Error */}
          {error && (
            <div className="mx-6 mt-6 p-3 rounded-lg text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {/* Result */}
          {result && <DesignSystemDisplay data={result} />}

          {/* ── Empty / centered search ── */}
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--sasi-navy)' }}>Systra</h2>
                <p className="text-sm" style={{ color: 'var(--sasi-gray)' }}>
                  Digite uma URL para extrair o design system completo
                </p>
              </div>

              <form onSubmit={handleAnalyze} className="w-full max-w-lg flex gap-2">
                <div
                  className="flex items-center gap-2 h-10 px-4 rounded-xl flex-1"
                  style={{ background: 'var(--sasi-input-bg)', border: '1px solid var(--sasi-input-border)' }}
                >
                  <IconSearch cls="w-4 h-4 shrink-0" />
                  <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="stripe.com, vercel.com, notion.so..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: 'var(--sasi-navy)' }}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!url.trim()}
                  className="h-10 px-5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--sasi-primary)' }}
                >
                  Analisar
                </button>
              </form>

              <p className="text-xs" style={{ color: 'var(--sasi-muted)' }}>
                fontes · cores · espaçamentos · bordas · sombras · imagens
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <span className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--sasi-border)', borderTopColor: 'var(--sasi-primary)' }} />
              <p className="text-sm" style={{ color: 'var(--sasi-gray)' }}>Analisando {url}…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
