import type { RequestCategory, ServiceRequest } from '../repositories/types.ts';

/** Service levels per request category, in calendar days (docs/domain/service-levels.md). */
export const SLA_DAYS: Readonly<Record<RequestCategory, number>> = Object.freeze({
  'address-change': 5,
  'value-transfer': 30,
  'retirement-quote': 10,
  complaint: 14,
});

const DAY_MS = 24 * 60 * 60 * 1000;

/** Due date = createdAt + SLA days (ISO YYYY-MM-DD). */
export function dueDate(request: Pick<ServiceRequest, 'category' | 'createdAt'>): string {
  const created = new Date(`${request.createdAt}T00:00:00Z`).getTime();
  return new Date(created + SLA_DAYS[request.category] * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days past the due date on `asOf`; 0 or less means not overdue. Closed requests are never overdue. */
export function daysOverdue(request: Pick<ServiceRequest, 'category' | 'createdAt' | 'status'>, asOf: string): number {
  if (request.status === 'closed') return 0;
  const due = new Date(`${dueDate(request)}T00:00:00Z`).getTime();
  return Math.floor((new Date(`${asOf}T00:00:00Z`).getTime() - due) / DAY_MS);
}
