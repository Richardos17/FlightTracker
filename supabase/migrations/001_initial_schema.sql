CREATE TABLE tracked_flights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin        TEXT NOT NULL,
  destination   TEXT NOT NULL,
  departure_date DATE NOT NULL,
  cabin_class   TEXT NOT NULL CHECK (cabin_class IN ('ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST')),
  label         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE price_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_flight_id UUID NOT NULL REFERENCES tracked_flights(id) ON DELETE CASCADE,
  fetched_at        TIMESTAMPTZ DEFAULT NOW(),
  price             NUMERIC(10,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'USD',
  carrier           TEXT,
  raw_response      JSONB
);

CREATE INDEX idx_price_history_flight_id ON price_history(tracked_flight_id);
CREATE INDEX idx_price_history_fetched_at ON price_history(fetched_at DESC);
