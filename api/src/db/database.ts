import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { annualAccrual, contributionSplit, pensionableSalary } from '../domain/pension.ts';

const here = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));
const SEED_DIR = here('../../../data/seed/');

function readSeed<T>(file: string): T {
  return JSON.parse(readFileSync(`${SEED_DIR}${file}`, 'utf8')) as T;
}

interface SeedMember {
  id: string; firstName: string; lastName: string; birthDate: string; employerId: string;
  startDate: string; fullTimeSalary: number; partTimeFactor: number; status: string;
}
interface SeedHistory { memberId: string; fromYear: number; toYear: number; fullTimeSalary: number; partTimeFactor: number }
interface SeedRequest {
  id: string; memberId: string; category: string; subject: string; description: string;
  status: string; createdAt: string; closedAt?: string;
}

/**
 * Creates a database, applies the schema and loads the synthetic seed data.
 * Default is an in-memory database: every start (and every test) gets a clean, known state.
 */
export function createDatabase(path: string = ':memory:'): DatabaseSync {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(readFileSync(here('./schema.sql'), 'utf8'));
  seed(db);
  return db;
}

function seed(db: DatabaseSync): void {
  const already = db.prepare('SELECT COUNT(*) AS n FROM members').get() as { n: number };
  if (already.n > 0) return;

  const insertEmployer = db.prepare('INSERT INTO employers (id, name, sector, city) VALUES (?, ?, ?, ?)');
  for (const e of readSeed<Array<{ id: string; name: string; sector: string; city: string }>>('employers.json')) {
    insertEmployer.run(e.id, e.name, e.sector, e.city);
  }

  const insertMember = db.prepare(`INSERT INTO members
    (id, first_name, last_name, birth_date, employer_id, start_date, full_time_salary, part_time_factor, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const m of readSeed<SeedMember[]>('members.json')) {
    insertMember.run(m.id, m.firstName, m.lastName, m.birthDate, m.employerId, m.startDate, m.fullTimeSalary, m.partTimeFactor, m.status);
  }

  const insertContribution = db.prepare(`INSERT INTO contributions
    (member_id, year, full_time_salary, part_time_factor, pensionable_salary, accrual, employer_contribution, employee_contribution)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const h of readSeed<{ history: SeedHistory[] }>('contributions.json').history) {
    for (let year = h.fromYear; year <= h.toYear; year++) {
      const pensionable = pensionableSalary(h.fullTimeSalary, h.partTimeFactor);
      const split = contributionSplit(pensionable);
      insertContribution.run(h.memberId, year, h.fullTimeSalary, h.partTimeFactor, pensionable,
        annualAccrual(pensionable), split.employer, split.employee);
    }
  }

  const insertRequest = db.prepare(`INSERT INTO service_requests
    (id, member_id, category, subject, description, status, created_at, closed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const r of readSeed<SeedRequest[]>('service-requests.json')) {
    insertRequest.run(r.id, r.memberId, r.category, r.subject, r.description, r.status, r.createdAt, r.closedAt ?? null);
  }
}
