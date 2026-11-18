import type { Router } from '../http/router.ts';
import { badRequest, notFound, unprocessable } from '../http/errors.ts';
import type { MemberRepository } from '../repositories/memberRepository.ts';
import type { ProjectionService } from '../services/projectionService.ts';

interface ProjectionBody { memberId?: unknown; retirementAge?: unknown; salaryGrowthRate?: unknown }

export function registerProjectionRoutes(
  router: Router,
  deps: { members: MemberRepository; projections: ProjectionService; today: () => string },
): void {
  router.post('/api/projections', ({ body }) => {
    const input = (body ?? {}) as ProjectionBody;
    const problems: string[] = [];
    if (typeof input.memberId !== 'string' || input.memberId.length === 0) problems.push('memberId is required');
    if (input.retirementAge !== undefined && !Number.isInteger(input.retirementAge)) problems.push('retirementAge must be an integer');
    if (input.salaryGrowthRate !== undefined && typeof input.salaryGrowthRate !== 'number') problems.push('salaryGrowthRate must be a number');
    if (problems.length) throw badRequest('Invalid projection request', problems);

    const member = deps.members.findById(input.memberId as string);
    if (!member) throw notFound(`Member ${input.memberId}`);

    try {
      const result = deps.projections.project(member, {
        asOf: deps.today(),
        retirementAge: input.retirementAge as number | undefined,
        salaryGrowthRate: input.salaryGrowthRate as number | undefined,
      });
      return { body: result };
    } catch (err) {
      if (err instanceof RangeError) throw unprocessable(err.message);
      throw err;
    }
  });
}
