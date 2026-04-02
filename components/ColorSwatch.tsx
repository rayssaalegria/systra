'use client';

interface ColorSwatchProps {
  color: string;
}

export default function ColorSwatch({ color }: ColorSwatchProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 group cursor-default" title={color}>
      <div
        className="w-8 h-8 rounded-lg transition-transform group-hover:scale-110"
        style={{
          backgroundColor: color,
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      />
      <span
        className="text-[9px] font-mono text-center break-all leading-tight transition-colors"
        style={{ color: 'var(--sasi-muted)' }}
      >
        {color}
      </span>
    </div>
  );
}
