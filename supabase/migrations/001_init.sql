-- ================================================================
-- ScamShield Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────
-- SITES: Cached scan results for each domain
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain        TEXT UNIQUE NOT NULL,
  trust_score   INT CHECK (trust_score BETWEEN 0 AND 100),
  verdict       TEXT CHECK (verdict IN ('safe', 'suspicious', 'dangerous')),
  scan_count    INT DEFAULT 1,
  report_count  INT DEFAULT 0,
  last_scanned  TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────
-- FLAGS: Red flags detected per scan
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id    UUID REFERENCES sites(id) ON DELETE CASCADE,
  category   TEXT NOT NULL,
  label      TEXT NOT NULL,
  detail     TEXT,
  severity   TEXT CHECK (severity IN ('high', 'medium', 'low')),
  icon       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────
-- REPORTS: Community scam reports
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id        UUID REFERENCES sites(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name   TEXT DEFAULT 'Anonymous',
  city           TEXT,
  description    TEXT NOT NULL,
  amount_lost    INT,
  screenshot_url TEXT,
  upvotes        INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────
-- AUTHORITIES: Country → reporting portal map
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS authorities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country     TEXT NOT NULL,
  country_code TEXT NOT NULL,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT,
  type        TEXT CHECK (type IN ('cybercrime', 'consumer', 'banking', 'police', 'other'))
);

-- ────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────
ALTER TABLE sites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports  ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorities ENABLE ROW LEVEL SECURITY;

-- Sites: public read, service role write
CREATE POLICY "sites_public_read"     ON sites       FOR SELECT USING (true);
CREATE POLICY "flags_public_read"     ON flags       FOR SELECT USING (true);
CREATE POLICY "reports_public_read"   ON reports     FOR SELECT USING (true);
CREATE POLICY "authorities_public_read" ON authorities FOR SELECT USING (true);

-- Reports: authenticated users can insert
CREATE POLICY "reports_auth_insert"   ON reports     FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- ────────────────────────────────────────────────
-- SEED: Authority data
-- ────────────────────────────────────────────────
INSERT INTO authorities (country, country_code, name, url, description, type) VALUES
  ('India', 'IN', 'National Cyber Crime Reporting Portal', 'https://cybercrime.gov.in', 'File cybercrime complaints including online fraud, fake websites, financial scams', 'cybercrime'),
  ('India', 'IN', 'Consumer Helpline', 'https://consumerhelpline.gov.in', 'Report unfair trade practices and consumer complaints', 'consumer'),
  ('India', 'IN', 'RBI Banking Ombudsman', 'https://bankingombudsman.rbi.org.in', 'Report fraud related to bank transactions and payment gateways', 'banking'),
  ('India', 'IN', 'Sanchar Saathi (TRAI)', 'https://sancharsaathi.gov.in', 'Report suspicious phone numbers and SMS used in scams', 'other'),
  ('USA', 'US', 'IC3 — Internet Crime Complaint Center', 'https://ic3.gov', 'FBI''s online crime reporting portal for internet fraud', 'cybercrime'),
  ('USA', 'US', 'FTC Consumer Reporting', 'https://reportfraud.ftc.gov', 'Report scams, fraud, and bad business practices to the FTC', 'consumer'),
  ('UK', 'GB', 'Action Fraud', 'https://actionfraud.police.uk', 'UK''s national reporting centre for fraud and cybercrime', 'cybercrime'),
  ('UK', 'GB', 'Citizens Advice Scams', 'https://citizensadvice.org.uk/consumer/scams', 'Report scams and get advice on your rights as a consumer', 'consumer'),
  ('Australia', 'AU', 'ScamWatch (ACCC)', 'https://scamwatch.gov.au', 'Australia''s national scam reporting and awareness portal', 'cybercrime'),
  ('Canada', 'CA', 'Canadian Anti-Fraud Centre', 'https://antifraudcentre-centreantifraude.ca', 'Report mass marketing fraud, identity theft and cybercrime', 'cybercrime');

-- ────────────────────────────────────────────────
-- INDEXES for performance
-- ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sites_domain       ON sites (domain);
CREATE INDEX IF NOT EXISTS idx_flags_site_id      ON flags (site_id);
CREATE INDEX IF NOT EXISTS idx_reports_site_id    ON reports (site_id);
CREATE INDEX IF NOT EXISTS idx_reports_created    ON reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_authorities_country ON authorities (country_code);
