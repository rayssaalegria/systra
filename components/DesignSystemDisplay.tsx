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

type Tab = 'tokens' | 'images';

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
    <span
      className="inline-block text-xs font-mono px-3 py-1.5 rounded-lg"
      style={{
        background: 'var(--sasi-input-bg)',
        border: '1px solid var(--sasi-input-border)',
        color: 'var(--sasi-primary)',
      }}
    >
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

// ── Images Tab ────────────────────────────────────────────────────────────────

function ImagesTab({ url }: { url: string }) {
  const [images, setImages] = useState<SiteImage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'svg' | 'png' | 'jpg' | 'gif' | 'webp'>('all');
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

  // Trigger fetch on first render of this tab
  if (!fetched) fetchImages();

  const filtered = images
    ? filter === 'all' ? images : images.filter(img => img.type === filter)
    : [];

  const types = images
    ? ['all', ...new Set(images.map(i => i.type))] as const
    : ['all'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <span
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--sasi-border)', borderTopColor: 'var(--sasi-primary)' }}
        />
        <p className="text-sm" style={{ color: 'var(--sasi-gray)' }}>Fetching images…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="mx-6 mt-6 p-3 rounded-lg text-sm"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}
      >
        {error}
      </div>
    );
  }

  if (images && images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <p className="text-sm font-medium" style={{ color: 'var(--sasi-navy)' }}>No images found</p>
        <p className="text-xs" style={{ color: 'var(--sasi-gray)' }}>No SVG or PNG assets were detected on this page.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-5">
      {/* Type filter tabs */}
      {images && images.length > 0 && (
        <div className="flex items-center gap-1 mb-6 pb-4" style={{ borderBottom: '1px solid var(--sasi-border)' }}>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t as typeof filter)}
              className="px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors"
              style={
                filter === t
                  ? { background: 'var(--sasi-primary)', color: '#fff' }
                  : { background: 'var(--sasi-input-bg)', color: 'var(--sasi-primary)', border: '1px solid var(--sasi-input-border)' }
              }
            >
              {t === 'all' ? `All (${images.length})` : `${t.toUpperCase()} (${images.filter(i => i.type === t).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {filtered.map((img, i) => (
          <a
            key={i}
            href={img.inline ? undefined : img.src}
            target={img.inline ? undefined : '_blank'}
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-1.5"
          >
            <div
              className="w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-[1.03]"
              style={{
                background: 'var(--sasi-page)',
                border: '1px solid var(--sasi-border)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.alt || img.type}
                className="max-w-full max-h-full object-contain p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <span className="text-[9px] font-mono uppercase" style={{ color: 'var(--sasi-muted)' }}>
              {img.inline ? 'inline svg' : img.type}
            </span>
          </a>
        ))}
      </div>
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
      {/* ── Tab bar ── */}
      <div
        className="flex items-center gap-1 px-6 pt-4 pb-0"
        style={{ borderBottom: '1px solid var(--sasi-border)' }}
      >
        {(['tokens', 'images'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="pb-3 px-1 mr-3 text-sm font-medium capitalize transition-colors"
            style={
              tab === t
                ? {
                    color: 'var(--sasi-navy)',
                    borderBottom: '2px solid var(--sasi-navy)',
                  }
                : {
                    color: 'var(--sasi-gray)',
                    borderBottom: '2px solid transparent',
                  }
            }
          >
            {t === 'tokens' ? 'Design Tokens' : 'Images'}
          </button>
        ))}
      </div>

      {/* ── Images tab ── */}
      {tab === 'images' && <ImagesTab url={data.url} />}

      {/* ── Tokens tab ── */}
      {tab === 'tokens' && (
        <div className="px-6 py-6 space-y-12">

          {/* Typography */}
          {hasTypography && (
            <section>
              <SectionDivider id="typography" title="Typography" description="Font families, sizes, and weights detected from CSS." />
              <div className="space-y-8">
                {data.fonts.families.length > 0 && (
                  <div>
                    <Label>Families</Label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {data.fonts.families.map(f => <Tag key={f} value={f} />)}
                    </div>
                    <div className="space-y-2">
                      {data.fonts.families.slice(0, 3).map(f => (
                        <div
                          key={f}
                          className="p-4 rounded-xl"
                          style={{ background: 'var(--sasi-page)', border: '1px solid var(--sasi-border)' }}
                        >
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
                        <span
                          key={f}
                          className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgba(57,74,165,0.08)', border: '1px solid rgba(57,74,165,0.2)', color: 'var(--sasi-primary)' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--sasi-primary)' }} />
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {data.fonts.sizes.length > 0 && (
                  <div>
                    <Label>Sizes</Label>
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
                    <Label>Weights</Label>
                    <div className="space-y-2">
                      {data.fonts.weights.map(w => (
                        <div key={w} className="flex items-center gap-4">
                          <span className="w-14 text-[11px] font-mono shrink-0 text-right" style={{ color: 'var(--sasi-muted)' }}>{w}</span>
                          <span className="text-base" style={{ fontWeight: w, color: 'var(--sasi-navy)' }}>
                            The quick brown fox
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Colors */}
          {hasColors && (
            <section>
              <SectionDivider id="colors" title="Colors" description="Color palette extracted from CSS custom properties and computed styles." />
              <div className="space-y-8">
                {data.colors.all.length > 0 && (
                  <div>
                    <Label>Palette — {data.colors.all.length} colors</Label>
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-3">
                      {data.colors.all.slice(0, 36).map(c => <ColorSwatch key={c} color={c} />)}
                    </div>
                  </div>
                )}
                {data.colors.backgrounds.length > 0 && (
                  <div>
                    <Label>Backgrounds</Label>
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-3">
                      {data.colors.backgrounds.map(c => <ColorSwatch key={c} color={c} />)}
                    </div>
                  </div>
                )}
                {data.colors.texts.length > 0 && (
                  <div>
                    <Label>Text colors</Label>
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-3">
                      {data.colors.texts.map(c => <ColorSwatch key={c} color={c} />)}
                    </div>
                  </div>
                )}
                {data.colors.borders.length > 0 && (
                  <div>
                    <Label>Borders</Label>
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-3">
                      {data.colors.borders.map(c => <ColorSwatch key={c} color={c} />)}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Spacing */}
          {data.spacing.length > 0 && (
            <section>
              <SectionDivider id="spacing" title="Spacing" description="Spacing values used in padding, margin, and gap." />
              <div className="space-y-2">
                {data.spacing.map(s => (
                  <div key={s} className="flex items-center gap-4">
                    <span className="w-16 text-[11px] font-mono shrink-0 text-right" style={{ color: 'var(--sasi-muted)' }}>{s}</span>
                    <div
                      className="h-5 rounded"
                      style={{
                        width: `min(${s}, 100%)`,
                        minWidth: '4px',
                        background: 'rgba(57,74,165,0.12)',
                        border: '1px solid rgba(57,74,165,0.2)',
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Border Radius */}
          {data.radii.length > 0 && (
            <section>
              <SectionDivider id="border-radius" title="Border radius" description="Corner radius values detected across elements." />
              <div className="flex flex-wrap gap-6">
                {data.radii.map(r => (
                  <div key={r} className="flex flex-col items-center gap-2">
                    <div
                      className="w-14 h-14"
                      style={{
                        borderRadius: r,
                        background: 'var(--sasi-page)',
                        border: '1px solid var(--sasi-input-border)',
                      }}
                    />
                    <span className="text-[11px] font-mono" style={{ color: 'var(--sasi-muted)' }}>{r}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Shadows */}
          {data.shadows.length > 0 && (
            <section>
              <SectionDivider id="shadows" title="Shadows" description="Box shadow values used to create depth and elevation." />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {data.shadows.map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-xl"
                      style={{ background: 'var(--sasi-content)', boxShadow: s, border: '1px solid var(--sasi-border)' }}
                    />
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
