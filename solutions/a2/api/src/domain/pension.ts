import type { SchemeParameters } from './scheme.ts';
import { SCHEME_2026 } from './scheme.ts';

/** Rounds a money amount to cents (half away from zero). */
export function roundMoney(amount: number): number {
  return Math.sign(amount) * Math.round(Math.abs(amount) * 100) / 100;
}

/**
 * Pensionable salary = (min(salary, cap) − franchise) × part-time factor, never below zero.
 * `salary` is always the FULL-TIME equivalent annual salary.
 */
export function pensionableSalary(
  fullTimeSalary: number,
  partTimeFactor: number,
  scheme: SchemeParameters = SCHEME_2026,
): number {
  if (!Number.isFinite(fullTimeSalary) || fullTimeSalary < 0) {
    throw new RangeError('fullTimeSalary must be a non-negative number');
  }
  if (!Number.isFinite(partTimeFactor) || partTimeFactor <= 0 || partTimeFactor > 1) {
    throw new RangeError('partTimeFactor must be greater than 0 and at most 1');
  }
  const capped = Math.min(fullTimeSalary, scheme.salaryCap);
  return roundMoney(Math.max(0, capped - scheme.franchise) * partTimeFactor);
}

/** Yearly pension accrual for one full year of service. */
export function annualAccrual(pensionable: number, scheme: SchemeParameters = SCHEME_2026): number {
  return roundMoney(pensionable * scheme.accrualRate);
}

/** Splits the yearly contribution between employer and employee. */
export function contributionSplit(pensionable: number, scheme: SchemeParameters = SCHEME_2026) {
  const total = roundMoney(pensionable * scheme.contributionRate);
  const employer = roundMoney(total * scheme.employerShare);
  return { total, employer, employee: roundMoney(total - employer) };
}

/** Age in whole years on a given date. Dates are ISO strings (YYYY-MM-DD). */
export function ageOn(birthDate: string, onDate: string): number {
  const b = new Date(`${birthDate}T00:00:00Z`);
  const d = new Date(`${onDate}T00:00:00Z`);
  if (Number.isNaN(b.getTime()) || Number.isNaN(d.getTime())) {
    throw new RangeError('dates must be ISO dates (YYYY-MM-DD)');
  }
  let age = d.getUTCFullYear() - b.getUTCFullYear();
  const beforeBirthday =
    d.getUTCMonth() < b.getUTCMonth() ||
    (d.getUTCMonth() === b.getUTCMonth() && d.getUTCDate() < b.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Date on which the member reaches `age` (ISO YYYY-MM-DD). */
export function dateAtAge(birthDate: string, age: number): string {
  const b = new Date(`${birthDate}T00:00:00Z`);
  b.setUTCFullYear(b.getUTCFullYear() + age);
  return b.toISOString().slice(0, 10);
}

export interface ProjectionInput {
  birthDate: string;
  fullTimeSalary: number;
  partTimeFactor: number;
  accruedToDate: number;
  asOf: string;
  retirementAge?: number;
  salaryGrowthRate?: number;
}

export interface ProjectionResult {
  retirementAge: number;
  retirementDate: string;
  yearsToRetirement: number;
  accruedToDate: number;
  futureAccrual: number;
  /** Fraction by which the pension is reduced for early retirement (0 at the standard age). */
  earlyRetirementReduction: number;
  /** Yearly pension before the early-retirement reduction. */
  unreducedAnnualPension: number;
  projectedAnnualPension: number;
  scheme: string;
}

/**
 * Projects the yearly pension at the chosen retirement age (default: the standard age).
 * Assumes the member keeps working with the same part-time factor until retirement.
 *
 * Early retirement (docs/domain/scheme-rules.md, rule R5):
 *  - allowed from scheme.earlyRetirementMinAge up to the standard retirement age
 *  - accrual stops at the early retirement date
 *  - the total pension is reduced by earlyRetirementReductionPerYear per year before the standard age (simple, not compounding)
 */
export function projectPension(input: ProjectionInput, scheme: SchemeParameters = SCHEME_2026): ProjectionResult {
  const retirementAge = input.retirementAge ?? scheme.retirementAge;
  if (!Number.isInteger(retirementAge)) {
    throw new RangeError('retirementAge must be a whole number of years');
  }
  if (retirementAge < scheme.earlyRetirementMinAge || retirementAge > scheme.retirementAge) {
    throw new RangeError(
      `retirementAge must be between ${scheme.earlyRetirementMinAge} and ${scheme.retirementAge}`,
    );
  }
  const growth = input.salaryGrowthRate ?? 0;
  if (!Number.isFinite(growth) || growth < 0 || growth > 0.1) {
    throw new RangeError('salaryGrowthRate must be between 0 and 0.1');
  }
  const currentAge = ageOn(input.birthDate, input.asOf);
  if (retirementAge < currentAge) {
    throw new RangeError(`retirementAge ${retirementAge} is below the member's current age ${currentAge}`);
  }
  const yearsToRetirement = retirementAge - currentAge;

  let futureAccrual = 0;
  let salary = input.fullTimeSalary;
  for (let year = 0; year < yearsToRetirement; year++) {
    futureAccrual += annualAccrual(pensionableSalary(salary, input.partTimeFactor, scheme), scheme);
    salary = salary * (1 + growth);
  }
  futureAccrual = roundMoney(futureAccrual);

  const yearsEarly = scheme.retirementAge - retirementAge;
  const earlyRetirementReduction = Math.round(yearsEarly * scheme.earlyRetirementReductionPerYear * 10_000) / 10_000;
  const unreducedAnnualPension = roundMoney(input.accruedToDate + futureAccrual);

  return {
    retirementAge,
    retirementDate: dateAtAge(input.birthDate, retirementAge),
    yearsToRetirement,
    accruedToDate: roundMoney(input.accruedToDate),
    futureAccrual,
    earlyRetirementReduction,
    unreducedAnnualPension,
    projectedAnnualPension: roundMoney(unreducedAnnualPension * (1 - earlyRetirementReduction)),
    scheme: scheme.id,
  };
}
