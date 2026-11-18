import type { Router } from '../http/router.ts';
import { badRequest, notFound } from '../http/errors.ts';
import type { MemberRepository } from '../repositories/memberRepository.ts';
import type { ContributionRepository } from '../repositories/contributionRepository.ts';
import type { StatementService } from '../services/statementService.ts';
import type { MemberStatus } from '../repositories/types.ts';

const STATUSES: readonly MemberStatus[] = ['active', 'deferred', 'retired'];

export interface MemberRouteDeps {
  members: MemberRepository;
  contributions: ContributionRepository;
  statements: StatementService;
  today: () => string;
}

export function registerMemberRoutes(router: Router, deps: MemberRouteDeps): void {
  router.get('/api/members', ({ query }) => {
    const status = query.get('status') ?? undefined;
    if (status && !STATUSES.includes(status as MemberStatus)) {
      throw badRequest(`status must be one of: ${STATUSES.join(', ')}`);
    }
    const employerId = query.get('employerId') ?? undefined;
    return { body: deps.members.list({ status: status as MemberStatus | undefined, employerId }) };
  });

  router.get('/api/members/:id', ({ params }) => {
    const member = deps.members.findById(params.id);
    if (!member) throw notFound(`Member ${params.id}`);
    return { body: member };
  });

  router.get('/api/members/:id/contributions', ({ params }) => {
    if (!deps.members.findById(params.id)) throw notFound(`Member ${params.id}`);
    return { body: deps.contributions.listByMember(params.id) };
  });

  router.get('/api/members/:id/statement', ({ params, query }) => {
    const member = deps.members.findById(params.id);
    if (!member) throw notFound(`Member ${params.id}`);
    const asOf = query.get('asOf') ?? deps.today();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw badRequest('asOf must be an ISO date (YYYY-MM-DD)');
    return { body: deps.statements.build(member, asOf) };
  });
}
