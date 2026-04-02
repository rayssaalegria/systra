'use client';

import { useState } from 'react';
import { DesignSystem } from '@/types';
import DesignSystemDisplay from '@/components/DesignSystemDisplay';
import HistoryPanel from '@/components/HistoryPanel';

const SECTIONS = [
  { id: 'typography', label: 'Typography' },
  { id: 'colors', label: 'Colors' },
  { id: 'spacing', label: 'Spacing' },
  { id: 'border-radius', label: 'Border radius' },
  { id: 'shadows', label: 'Shadows' },
];

function SidebarIcon({ type }: { type: string }) {
  const cls = 'w-4 h-4 shrink-0 text-[var(--sasi-primary)]';
  if (type === 'search') return (
    <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5l2.5 2.5" />
    </svg>
  );
  if (type === 'history') return (
    <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 8a5.5 5.5 0 1 0 5.5-5.5 5.72 5.72 0 0 0-3.9 1.6L2.5 5.5" /><path d="M2.5 2.5v3h3" /><path d="M8 5.5V8l2 1" />
    </svg>
  );
  if (type === 'dot') return <span className="w-1.5 h-1.5 rounded-full bg-[var(--sasi-primary)] shrink-0" />;
  return null;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DesignSystem | null>(null);
  const [error, setError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

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

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 flex flex-col justify-between" style={{ background: 'var(--sasi-sidebar)' }}>
        <div className="flex flex-col">
          {/* Brand — same height as header (76px) */}
          <div className="flex items-center gap-2 px-4 h-[76px] shrink-0">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ background: 'var(--sasi-primary)' }}>
              S
            </div>
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--sasi-navy)' }}>Systra</span>
          </div>

          {/* Nav */}
          <nav className="flex flex-col">
            <button
              className="flex items-center gap-2.5 px-4 h-14 text-sm font-medium text-left w-full transition-colors"
              style={{ color: 'var(--sasi-primary)' }}
            >
              <SidebarIcon type="search" />
              Analyzer
            </button>
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-2.5 px-4 h-14 text-sm font-medium text-left w-full transition-colors hover:bg-white/30"
              style={{ color: 'var(--sasi-primary)' }}
            >
              <SidebarIcon type="history" />
              History
            </button>
          </nav>

          {/* Section nav — only when result loaded */}
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
                    <SidebarIcon type="dot" />
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--sasi-border)' }}>
          <p className="text-[10px]" style={{ color: 'var(--sasi-muted)' }}>v1.0 · Design System Extractor</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--sasi-primary)' }}>by Rayssa Alegria</p>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col pr-2 pb-2 min-w-0">

        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between px-6 h-[76px]"
          style={{
            background: 'var(--sasi-content)',
            borderRadius: '8px 8px 0 0',
            borderBottom: '1px solid var(--sasi-border)',
          }}
        >
          <div>
            <h1 className="text-2xl font-bold leading-none" style={{ color: 'var(--sasi-navy)' }}>
              {result ? result.domain : 'Analyzer'}
            </h1>
            {result && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] mt-1 block hover:underline truncate max-w-sm"
                style={{ color: 'var(--sasi-gray)' }}
              >
                {result.url}
              </a>
            )}
          </div>

          {/* URL Input form */}
          <form onSubmit={handleAnalyze} className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 h-8 px-3 rounded-lg text-sm"
              style={{
                background: 'var(--sasi-input-bg)',
                border: '1px solid var(--sasi-input-border)',
                minWidth: '280px',
              }}
            >
              <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--sasi-primary)' }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5l2.5 2.5" />
              </svg>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="stripe.com, vercel.com..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--sasi-navy)' }}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="h-8 px-4 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{ background: 'var(--sasi-primary)' }}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing
                </>
              ) : 'Analyze'}
            </button>
          </form>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto min-h-0"
          style={{
            background: 'var(--sasi-content)',
            borderRadius: '0 0 8px 8px',
          }}
        >
          {/* Error */}
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {/* Result */}
          {result && <DesignSystemDisplay data={result} />}

          {/* Empty state */}
          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-24">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--sasi-input-bg)', border: '1px solid var(--sasi-border)' }}
              >
                <svg className="w-7 h-7" style={{ color: 'var(--sasi-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" /><path d="M16.5 16.5l4 4" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--sasi-navy)' }}>Enter a URL to extract its design system</p>
                <p className="text-sm mt-1" style={{ color: 'var(--sasi-gray)' }}>fonts, colors, spacing, radii and shadows</p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full py-24 gap-3">
              <span className="w-8 h-8 border-2 border-[var(--sasi-input-border)] border-t-[var(--sasi-primary)] rounded-full animate-spin" />
              <p className="text-sm" style={{ color: 'var(--sasi-gray)' }}>Analyzing {url}…</p>
            </div>
          )}
        </div>
      </div>

      {/* History Panel */}
      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={(r) => { setResult(r); setUrl(r.url); }}
      />
    </div>
  );
}
