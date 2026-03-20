export interface DesignSystem {
  url: string;
  domain: string;
  favicon?: string;
  fonts: {
    families: string[];
    sizes: string[];
    weights: string[];
    googleFonts: string[];
  };
  colors: {
    all: string[];
    backgrounds: string[];
    texts: string[];
    borders: string[];
  };
  radii: string[];
  shadows: string[];
  spacing: string[];
  analyzedAt: string;
}

export interface AnalysisRecord {
  id: string;
  url: string;
  result: DesignSystem;
  created_at: string;
}
