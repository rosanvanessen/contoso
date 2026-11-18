-- Contoso Pension Platform — SQLite schema (synthetic data only)
CREATE TABLE IF NOT EXISTS employers (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  sector  TEXT NOT NULL,
  city    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
  id               TEXT PRIMARY KEY,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  birth_date       TEXT NOT NULL,
  employer_id      TEXT NOT NULL REFERENCES employers(id),
  start_date       TEXT NOT NULL,
  full_time_salary REAL NOT NULL CHECK (full_time_salary >= 0),
  part_time_factor REAL NOT NULL CHECK (part_time_factor > 0 AND part_time_factor <= 1),
  status           TEXT NOT NULL CHECK (status IN ('active', 'deferred', 'retired'))
);

CREATE TABLE IF NOT EXISTS contributions (
  member_id              TEXT NOT NULL REFERENCES members(id),
  year                   INTEGER NOT NULL,
  full_time_salary       REAL NOT NULL,
  part_time_factor       REAL NOT NULL,
  pensionable_salary     REAL NOT NULL,
  accrual                REAL NOT NULL,
  employer_contribution  REAL NOT NULL,
  employee_contribution  REAL NOT NULL,
  PRIMARY KEY (member_id, year)
);

CREATE TABLE IF NOT EXISTS service_requests (
  id          TEXT PRIMARY KEY,
  member_id   TEXT NOT NULL REFERENCES members(id),
  category    TEXT NOT NULL CHECK (category IN ('address-change', 'value-transfer', 'retirement-quote', 'complaint')),
  subject     TEXT NOT NULL,
  description TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('open', 'in-progress', 'closed')),
  created_at  TEXT NOT NULL,
  closed_at   TEXT
);
