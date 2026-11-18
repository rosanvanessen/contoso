import type { DatabaseSync } from 'node:sqlite';
import type { RequestCategory, RequestStatus, ServiceRequest } from './types.ts';

interface RequestRow {
  id: string; member_id: string; category: RequestCategory; subject: string; description: string;
  status: RequestStatus; created_at: string; closed_at: string | null;
}

const toRequest = (r: RequestRow): ServiceRequest => ({
  id: r.id,
  memberId: r.member_id,
  category: r.category,
  subject: r.subject,
  description: r.description,
  status: r.status,
  createdAt: r.created_at,
  closedAt: r.closed_at,
});

export class ServiceRequestRepository {
  private readonly db: DatabaseSync;
  constructor(db: DatabaseSync) { this.db = db; }

  list(filter: { status?: RequestStatus; memberId?: string } = {}): ServiceRequest[] {
    const where: string[] = [];
    const params: string[] = [];
    if (filter.status) { where.push('status = ?'); params.push(filter.status); }
    if (filter.memberId) { where.push('member_id = ?'); params.push(filter.memberId); }
    const sql = `SELECT * FROM service_requests ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at, id`;
    return (this.db.prepare(sql).all(...params) as unknown as RequestRow[]).map(toRequest);
  }

  findById(id: string): ServiceRequest | undefined {
    const row = this.db.prepare('SELECT * FROM service_requests WHERE id = ?').get(id) as unknown as RequestRow | undefined;
    return row ? toRequest(row) : undefined;
  }

  nextId(): string {
    const row = this.db.prepare("SELECT MAX(CAST(SUBSTR(id, 4) AS INTEGER)) AS max FROM service_requests").get() as { max: number | null };
    return `SR-${(row.max ?? 5000) + 1}`;
  }

  create(request: Omit<ServiceRequest, 'closedAt'>): ServiceRequest {
    this.db.prepare(`INSERT INTO service_requests (id, member_id, category, subject, description, status, created_at, closed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`)
      .run(request.id, request.memberId, request.category, request.subject, request.description, request.status, request.createdAt);
    return this.findById(request.id)!;
  }
}
