import { projectPension, roundMoney } from '../domain/pension.ts';
import type { ProjectionResult } from '../domain/pension.ts';
import type { ContributionRepository } from '../repositories/contributionRepository.ts';
import type { Member } from '../repositories/types.ts';

export interface ProjectionRequest {
  retirementAge?: number;
  salaryGrowthRate?: number;
  asOf: string;
}

export class ProjectionService {
  private readonly contributions: ContributionRepository;
  constructor(contributions: ContributionRepository) { this.contributions = contributions; }

  project(member: Member, request: ProjectionRequest): ProjectionResult & { memberId: string } {
    const accruedToDate = roundMoney(this.contributions.totalAccrual(member.id));
    const result = projectPension({
      birthDate: member.birthDate,
      fullTimeSalary: member.fullTimeSalary,
      partTimeFactor: member.partTimeFactor,
      accruedToDate,
      asOf: request.asOf,
      retirementAge: request.retirementAge,
      salaryGrowthRate: request.salaryGrowthRate,
    });
    return { memberId: member.id, ...result };
  }
}
