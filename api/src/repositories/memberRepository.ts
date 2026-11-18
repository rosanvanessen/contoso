import type { DatabaseSync } from 'node:sqlite';
import type { Member, MemberStatus } from './types.ts';

interface MemberRow {
  id: string; first_name: string; last_name: string; birth_date: string; employer_id: string;
  start_date: string; full_time_salary: number; part_time_factor: number; status: MemberStatus;
}

const toMember = (r: MemberRow): Member => ({
  id: r.id,
  firstName: r.first_name,
  lastName: r.last_name,
  birthDate: r.birth_date,
  employerId: r.employer_id,
  startDate: r.start_date,
  fullTimeSalary: r.full_time_salary,
  partTimeFactor: r.part_time_factor,
  status: r.status,
});

/** Data access for members. Repositories contain SQL only — no business rules. */
export class MemberRepository {
  private readonly db: DatabaseSync;
  constructor(db: DatabaseSync) { this.db = db; }

  list(filter: { employerId?: string; status?: MemberStatus } = {}): Member[] {
    const where: string[] = [];
    const params: string[] = [];
    if (filter.employerId) { where.push('employer_id = ?'); params.push(filter.employerId); }
    if (filter.status) { where.push('status = ?'); params.push(filter.status); }
    const sql = `SELECT * FROM members ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id`;
    return (this.db.prepare(sql).all(...params) as unknown as MemberRow[]).map(toMember);
  }

  findById(id: string): Member | undefined {
    const row = this.db.prepare('SELECT * FROM members WHERE id = ?').get(id) as unknown as MemberRow | undefined;
    return row ? toMember(row) : undefined;
  }
}
