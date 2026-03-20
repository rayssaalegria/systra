'use client';

interface ColorSwatchProps {
  color: string;
}

export default function ColorSwatch({ color }: ColorSwatchProps) {
  return (
    <div className="flex flex-col items-center gap-1 group cursor-default">
      <div
        className="w-10 h-10 rounded-lg border border-white/10 shadow-sm transition-transform group-hover:scale-110"
        style={{ backgroundColor: color }}
        title={color}
      />
      <span className="text-[10px] text-zinc-500 font-mono">{color}</span>
    </div>
  );
}
