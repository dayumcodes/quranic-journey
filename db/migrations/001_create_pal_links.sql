CREATE TABLE IF NOT EXISTS pal_links (
  user_low TEXT NOT NULL,
  user_high TEXT NOT NULL,
  low_display_name TEXT,
  high_display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pal_links_pk PRIMARY KEY (user_low, user_high),
  CONSTRAINT pal_links_order CHECK (user_low < user_high)
);

CREATE INDEX IF NOT EXISTS pal_links_user_low_idx ON pal_links (user_low);
CREATE INDEX IF NOT EXISTS pal_links_user_high_idx ON pal_links (user_high);
