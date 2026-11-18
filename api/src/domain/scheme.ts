/**
 * Contoso Basic Scheme 2026 — FICTIONAL scheme parameters.
 * Inspired by career-average defined-benefit schemes, simplified for training.
 * These values are NOT real pension rules and must never be used for advice.
 * Business rules are documented in docs/domain/scheme-rules.md.
 */
export interface SchemeParameters {
  readonly id: string;
  readonly name: string;
  /** Part of the salary on which no pension is accrued (EUR / year, full-time). */
  readonly franchise: number;
  /** Maximum salary taken into account (EUR / year, full-time). */
  readonly salaryCap: number;
  /** Yearly accrual as a fraction of the pensionable salary. */
  readonly accrualRate: number;
  /** Standard retirement age in whole years. */
  readonly retirementAge: number;
  /** Earliest age at which a member may retire early. */
  readonly earlyRetirementMinAge: number;
  /** Reduction applied per year of early retirement (fraction). */
  readonly earlyRetirementReductionPerYear: number;
  /** Total contribution as a fraction of the pensionable salary. */
  readonly contributionRate: number;
  /** Employer share of the total contribution (fraction). */
  readonly employerShare: number;
}

export const SCHEME_2026: SchemeParameters = Object.freeze({
  id: 'CF-2026',
  name: 'Contoso Basic Scheme 2026 (fictional)',
  franchise: 17_545,
  salaryCap: 137_800,
  accrualRate: 0.0175,
  retirementAge: 68,
  earlyRetirementMinAge: 60,
  earlyRetirementReductionPerYear: 0.065,
  contributionRate: 0.27,
  employerShare: 0.6,
});
