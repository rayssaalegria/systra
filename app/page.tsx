'use client';

import { useState } from 'react';
import { DesignSystem } from '@/types';
import DesignSystemDisplay from '@/components/DesignSystemDisplay';
import HistoryPanel from '@/components/HistoryPanel';

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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-400">Design System Extractor</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-3">
            <span className="text-white">Sys</span>
            <span className="text-emerald-400">tra</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">
            Cole a URL de qualquer site e extraia o design system completo — fontes, cores, espaçamentos e mais.
          </p>
        </div>

        {/* Input + History button */}
        <form onSubmit={handleAnalyze} className="mb-10">
          <div className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 focus-within:border-zinc-600 transition-colors">
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="stripe.com, vercel.com, notion.so..."
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder-zinc-600 outline-none text-sm"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 px-3 py-3 rounded-xl transition-colors"
              title="Histórico"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Analisando
                </>
              ) : (
                'Analisar'
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {result && <DesignSystemDisplay data={result} />}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="text-center py-16 text-zinc-700">
            <div className="text-6xl mb-4">⬡</div>
            <p className="text-sm">Digite uma URL para começar</p>
          </div>
        )}
      </div>

      {/* History Panel */}
      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={(r) => { setResult(r); setUrl(r.url); }}
      />
    </main>
  );
}
