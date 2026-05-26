ALTER TABLE price_history ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'serpapi';
