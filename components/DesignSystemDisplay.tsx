'use client';

import { DesignSystem } from '@/types';
import ColorSwatch from './ColorSwatch';

interface Props {
  data: DesignSystem;
}

function Section({ title, children, empty }: { title: string; children?: React.ReactNode; empty?: boolean }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">{title}</h3>
      {empty ? (
        <p className="text-sm text-zinc-600">Nenhum valor encontrado</p>
      ) : (
        children
      )}
    </div>
  );
}

function Tag({ value }: { value: string }) {
  return (
    <span className="inline-block bg-zinc-800 text-zinc-200 text-xs font-mono px-3 py-1 rounded-full border border-zinc-700">
      {value}
    </span>
  );
}

export default function DesignSystemDisplay({ data }: Props) {
  const allColors = [...new Set([...data.colors.all, ...data.colors.backgrounds, ...data.colors.texts])];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        {data.favicon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.favicon} alt="favicon" className="w-6 h-6 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        <div>
          <h2 className="text-white font-semibold">{data.domain}</h2>
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors truncate">{data.url}</a>
        </div>
        <div className="ml-auto text-right">
          <span className="text-xs text-zinc-600">Analisado às</span>
          <p className="text-xs text-zinc-400">{new Date(data.analyzedAt).toLocaleTimeString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Typography */}
        <Section title="Tipografia" empty={data.fonts.families.length === 0}>
          <div className="space-y-4">
            {data.fonts.families.length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-500 mb-2">Famílias</p>
                <div className="flex flex-wrap gap-2">
                  {data.fonts.families.map(f => (
                    <Tag key={f} value={f} />
                  ))}
                </div>
              </div>
            )}
            {data.fonts.googleFonts.length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-500 mb-2">Google Fonts detectadas</p>
                <div className="flex flex-wrap gap-2">
                  {data.fonts.googleFonts.map(f => (
                    <span key={f} className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 text-xs font-mono px-3 py-1 rounded-full border border-blue-500/20">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.fonts.sizes.length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-500 mb-2">Tamanhos</p>
                <div className="flex flex-wrap gap-2">
                  {data.fonts.sizes.map(s => <Tag key={s} value={s} />)}
                </div>
              </div>
            )}
            {data.fonts.weights.length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-500 mb-2">Pesos</p>
                <div className="flex flex-wrap gap-2">
                  {data.fonts.weights.map(w => <Tag key={w} value={w} />)}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Colors */}
        <Section title="Cores" empty={allColors.length === 0}>
          <div className="space-y-4">
            {data.colors.all.length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-500 mb-3">Paleta geral</p>
                <div className="flex flex-wrap gap-3">
                  {data.colors.all.slice(0, 20).map(c => <ColorSwatch key={c} color={c} />)}
                </div>
              </div>
            )}
            {data.colors.backgrounds.length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-500 mb-3">Backgrounds</p>
                <div className="flex flex-wrap gap-3">
                  {data.colors.backgrounds.map(c => <ColorSwatch key={c} color={c} />)}
                </div>
              </div>
            )}
            {data.colors.texts.length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-500 mb-3">Textos</p>
                <div className="flex flex-wrap gap-3">
                  {data.colors.texts.map(c => <ColorSwatch key={c} color={c} />)}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Border Radius */}
        <Section title="Border Radius" empty={data.radii.length === 0}>
          <div className="flex flex-wrap gap-3">
            {data.radii.map(r => (
              <div key={r} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-zinc-700 border border-zinc-600" style={{ borderRadius: r }} />
                <span className="text-[10px] text-zinc-500 font-mono">{r}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Spacing */}
        <Section title="Spacing" empty={data.spacing.length === 0}>
          <div className="space-y-2">
            {data.spacing.map(s => (
              <div key={s} className="flex items-center gap-3">
                <div className="bg-blue-500/20 border border-blue-500/30 h-4 rounded" style={{ width: `min(${s}, 100%)`, minWidth: '8px' }} />
                <span className="text-xs text-zinc-400 font-mono">{s}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Shadows */}
      {data.shadows.length > 0 && (
        <Section title="Box Shadows">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.shadows.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-zinc-700 rounded-xl" style={{ boxShadow: s }} />
                <span className="text-[10px] text-zinc-500 font-mono text-center line-clamp-2">{s}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
