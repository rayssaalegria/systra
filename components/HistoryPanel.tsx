'use client';

import { useEffect, useState } from 'react';
import { AnalysisRecord, DesignSystem } from '@/types';

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
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(35,45,100,0.3)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-80 z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'var(--sasi-content)', borderLeft: '1px solid var(--sasi-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--sasi-border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--sasi-navy)' }}>History</h2>
          <button
            onClick={onClose}
            className="text-sm leading-none transition-colors hover:opacity-70"
            style={{ color: 'var(--sasi-gray)' }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <span
                className="w-5 h-5 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--sasi-border)', borderTopColor: 'var(--sasi-primary)' }}
              />
            </div>
          )}

          {error && (
            <div
              className="m-4 p-3 rounded-xl text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}
            >
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-sm" style={{ color: 'var(--sasi-gray)' }}>
              No analyses yet
            </div>
          )}

          {!loading && items.map((item) => (
            <button
              key={item.id}
              onClick={() => { onSelect(item.result); onClose(); }}
              className="w-full text-left px-5 py-4 transition-colors group hover:bg-[var(--sasi-page)]"
              style={{ borderBottom: '1px solid var(--sasi-border)' }}
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.result.favicon}
                  alt=""
                  className="w-5 h-5 rounded flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--sasi-navy)' }}>
                    {item.result.domain}
                  </p>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--sasi-gray)' }}>
                    {item.url}
                  </p>
                </div>
              </div>

              {item.result.colors.all.length > 0 && (
                <div className="flex gap-1 mt-2 ml-8">
                  {item.result.colors.all.slice(0, 8).map(c => (
                    <div
                      key={c}
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: c, border: '1px solid rgba(0,0,0,0.08)' }}
                    />
                  ))}
                </div>
              )}

              <p className="text-[10px] mt-2 ml-8" style={{ color: 'var(--sasi-muted)' }}>
                {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
