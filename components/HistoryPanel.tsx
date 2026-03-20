'use client';

import { useEffect, useState } from 'react';
import { AnalysisRecord } from '@/types';
import { DesignSystem } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (result: DesignSystem) => void;
}

export default function HistoryPanel({ open, onClose, onSelect }: Props) {
  const [items, setItems] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    fetch('/api/history')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setItems(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Histórico</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <span className="w-5 h-5 border-2 border-zinc-700 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="m-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-zinc-600 text-sm">
              Nenhuma análise ainda
            </div>
          )}

          {!loading && items.map((item) => (
            <button
              key={item.id}
              onClick={() => { onSelect(item.result); onClose(); }}
              className="w-full text-left px-5 py-4 border-b border-zinc-800/60 hover:bg-zinc-800/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                {/* Favicon */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.result.favicon}
                  alt=""
                  className="w-5 h-5 rounded flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                    {item.result.domain}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{item.url}</p>
                </div>
              </div>

              {/* Color dots preview */}
              {item.result.colors.all.length > 0 && (
                <div className="flex gap-1 mt-2 ml-8">
                  {item.result.colors.all.slice(0, 8).map(c => (
                    <div key={c} className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}

              <p className="text-[10px] text-zinc-600 mt-2 ml-8">
                {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
