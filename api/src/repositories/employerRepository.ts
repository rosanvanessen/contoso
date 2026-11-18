import type { DatabaseSync } from 'node:sqlite';
import type { Employer } from './types.ts';

export class EmployerRepository {
  private readonly db: DatabaseSync;
  constructor(db: DatabaseSync) { this.db = db; }

  list(): Employer[] {
    return this.db.prepare('SELECT id, name, sector, city FROM employers ORDER BY id').all() as unknown as Employer[];
  }

  findById(id: string): Employer | undefined {
    return this.db.prepare('SELECT id, name, sector, city FROM employers WHERE id = ?').get(id) as unknown as Employer | undefined;
  }
}
