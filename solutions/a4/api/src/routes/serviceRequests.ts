import type { Router } from '../http/router.ts';
import { badRequest, notFound } from '../http/errors.ts';
import type { MemberRepository } from '../repositories/memberRepository.ts';
import type { ServiceRequestRepository } from '../repositories/serviceRequestRepository.ts';
import type { RequestCategory, RequestStatus } from '../repositories/types.ts';
import { daysOverdue, dueDate } from '../domain/serviceLevels.ts';

const CATEGORIES: readonly RequestCategory[] = ['address-change', 'value-transfer', 'retirement-quote', 'complaint'];
const STATUSES: readonly RequestStatus[] = ['open', 'in-progress', 'closed'];

interface CreateBody { memberId?: unknown; category?: unknown; subject?: unknown; description?: unknown }

export function registerServiceRequestRoutes(
  router: Router,
  deps: { members: MemberRepository; requests: ServiceRequestRepository; today: () => string },
): void {
  router.get('/api/service-requests', ({ query }) => {
    const status = query.get('status') ?? undefined;
    if (status && !STATUSES.includes(status as RequestStatus)) {
      throw badRequest(`status must be one of: ${STATUSES.join(', ')}`);
    }
    const memberId = query.get('memberId') ?? undefined;
    return { body: deps.requests.list({ status: status as RequestStatus | undefined, memberId }) };
  });

  // Registered BEFORE '/:id' — the router matches routes in registration order.
  router.get('/api/service-requests/overdue', ({ query }) => {
    const asOf = query.get('asOf') ?? deps.today();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw badRequest('asOf must be an ISO date (YYYY-MM-DD)');
    const overdue = deps.requests.list()
      .map((r) => ({ ...r, dueDate: dueDate(r), daysOverdue: daysOverdue(r, asOf) }))
      .filter((r) => r.daysOverdue > 0)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
    return { body: overdue };
  });

  router.get('/api/service-requests/:id', ({ params }) => {
    const request = deps.requests.findById(params.id);
    if (!request) throw notFound(`Service request ${params.id}`);
    return { body: request };
  });

  router.post('/api/service-requests', ({ body }) => {
    const input = (body ?? {}) as CreateBody;
    const problems: string[] = [];
    if (typeof input.memberId !== 'string') problems.push('memberId is required');
    if (typeof input.category !== 'string' || !CATEGORIES.includes(input.category as RequestCategory)) {
      problems.push(`category must be one of: ${CATEGORIES.join(', ')}`);
    }
    if (typeof input.subject !== 'string' || input.subject.trim().length < 3 || input.subject.length > 120) {
      problems.push('subject must be 3–120 characters');
    }
    if (typeof input.description !== 'string' || input.description.length > 2000) {
      problems.push('description is required (max 2000 characters)');
    }
    if (problems.length) throw badRequest('Invalid service request', problems);
    if (!deps.members.findById(input.memberId as string)) throw notFound(`Member ${input.memberId}`);

    const created = deps.requests.create({
      id: deps.requests.nextId(),
      memberId: input.memberId as string,
      category: input.category as RequestCategory,
      subject: (input.subject as string).trim(),
      description: input.description as string,
      status: 'open',
      createdAt: deps.today(),
    });
    return { status: 201, body: created };
  });
}
