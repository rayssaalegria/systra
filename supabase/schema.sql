-- Tabela para armazenar análises de design systems
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para busca por URL
CREATE INDEX IF NOT EXISTS analyses_url_idx ON analyses (url);
CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON analyses (created_at DESC);

-- RLS: público pode ler e inserir (app público)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read analyses"
  ON analyses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert analyses"
  ON analyses FOR INSERT
  WITH CHECK (true);
