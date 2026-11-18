import { annualAccrual, pensionableSalary, projectPension, roundMoney, ageOn } from '../domain/pension.ts';
import { SCHEME_2026 } from '../domain/scheme.ts';
import type { ContributionRepository } from '../repositories/contributionRepository.ts';
import type { Member } from '../repositories/types.ts';

export interface AnnualStatement {
  memberId: string;
  asOf: string;
  age: number;
  yearsOfService: number;
  accruedPension: number;
  currentPensionableSalary: number;
  currentYearAccrual: number;
  projectedPensionAtRetirement: number;
  retirementDate: string;
  scheme: string;
}

/**
 * Builds the yearly pension statement ("annual statement") for a member.
 * Accrued pension comes from the stored contribution history;
 * the current-year figures are calculated from the member's CURRENT salary and part-time factor.
 */
export class StatementService {
  private readonly contributions: ContributionRepository;
  constructor(contributions: ContributionRepository) { this.contributions = contributions; }

  build(member: Member, asOf: string): AnnualStatement {
    const history = this.contributions.listByMember(member.id);
    const accruedPension = roundMoney(this.contributions.totalAccrual(member.id));

    const currentPensionable = pensionableSalary(member.fullTimeSalary, member.partTimeFactor);
    const currentYearAccrual = annualAccrual(currentPensionable);

    const projection = projectPension({
      birthDate: member.birthDate,
      fullTimeSalary: member.fullTimeSalary,
      partTimeFactor: member.partTimeFactor,
      accruedToDate: accruedPension,
      asOf,
    });

    return {
      memberId: member.id,
      asOf,
      age: ageOn(member.birthDate, asOf),
      yearsOfService: history.length,
      accruedPension,
      currentPensionableSalary: currentPensionable,
      currentYearAccrual,
      projectedPensionAtRetirement: projection.projectedAnnualPension,
      retirementDate: projection.retirementDate,
      scheme: SCHEME_2026.id,
    };
  }
}
