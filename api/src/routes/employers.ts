import type { Router } from '../http/router.ts';
import { notFound } from '../http/errors.ts';
import type { EmployerRepository } from '../repositories/employerRepository.ts';
import type { MemberRepository } from '../repositories/memberRepository.ts';

export function registerEmployerRoutes(router: Router, deps: { employers: EmployerRepository; members: MemberRepository }): void {
  router.get('/api/employers', () => ({ body: deps.employers.list() }));

  router.get('/api/employers/:id', ({ params }) => {
    const employer = deps.employers.findById(params.id);
    if (!employer) throw notFound(`Employer ${params.id}`);
    const memberCount = deps.members.list({ employerId: employer.id }).length;
    return { body: { ...employer, memberCount } };
  });
}
