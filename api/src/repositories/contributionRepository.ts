import type { DatabaseSync } from 'node:sqlite';
import type { Contribution } from './types.ts';

interface ContributionRow {
  member_id: string; year: number; full_time_salary: number; part_time_factor: number;
  pensionable_salary: number; accrual: number; employer_contribution: number; employee_contribution: number;
}

const toContribution = (r: ContributionRow): Contribution => ({
  memberId: r.member_id,
  year: r.year,
  fullTimeSalary: r.full_time_salary,
  partTimeFactor: r.part_time_factor,
  pensionableSalary: r.pensionable_salary,
  accrual: r.accrual,
  employerContribution: r.employer_contribution,
  employeeContribution: r.employee_contribution,
});

export class ContributionRepository {
  private readonly db: DatabaseSync;
  constructor(db: DatabaseSync) { this.db = db; }

  listByMember(memberId: string): Contribution[] {
    return (this.db.prepare('SELECT * FROM contributions WHERE member_id = ? ORDER BY year')
      .all(memberId) as unknown as ContributionRow[]).map(toContribution);
  }

  totalAccrual(memberId: string): number {
    const row = this.db.prepare('SELECT COALESCE(SUM(accrual), 0) AS total FROM contributions WHERE member_id = ?')
      .get(memberId) as { total: number };
    return row.total;
  }
}
