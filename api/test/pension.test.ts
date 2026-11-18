import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageOn, annualAccrual, contributionSplit, pensionableSalary, projectPension } from '../src/domain/pension.ts';

test('pensionable salary subtracts the franchise', () => {
  assert.equal(pensionableSalary(52_000, 1), 34_455);
});

test('pensionable salary applies the part-time factor', () => {
  assert.equal(pensionableSalary(46_000, 0.6), 17_073);
});

test('pensionable salary is capped at the salary cap', () => {
  assert.equal(pensionableSalary(150_000, 1), 120_255);
});

test('pensionable salary is never negative (salary below franchise)', () => {
  assert.equal(pensionableSalary(16_000, 0.9), 0);
});

test('pensionable salary rejects invalid part-time factors', () => {
  assert.throws(() => pensionableSalary(40_000, 0), RangeError);
  assert.throws(() => pensionableSalary(40_000, 1.2), RangeError);
});

test('annual accrual is 1.75% of pensionable salary', () => {
  assert.equal(annualAccrual(34_455), 602.96);
});

test('contribution split is 60% employer / 40% employee', () => {
  assert.deepEqual(contributionSplit(10_000), { total: 2_700, employer: 1_620, employee: 1_080 });
});

test('age is calculated in whole years', () => {
  assert.equal(ageOn('1972-04-15', '2026-11-18'), 54);
  assert.equal(ageOn('1979-12-20', '2026-11-18'), 46);
});

test('projection at the standard retirement age adds future accrual', () => {
  const result = projectPension({
    birthDate: '1972-04-15', fullTimeSalary: 52_000, partTimeFactor: 1, accruedToDate: 5_000, asOf: '2026-11-18',
  });
  assert.equal(result.yearsToRetirement, 14);
  assert.equal(result.futureAccrual, 8_441.44);
  assert.equal(result.earlyRetirementReduction, 0);
  assert.equal(result.unreducedAnnualPension, 13_441.44);
  assert.equal(result.projectedAnnualPension, 13_441.44);
  assert.equal(result.retirementDate, '2040-04-15');
});

test('projection stops accrual at early retirement and reduces the total pension', () => {
  const result = projectPension({
    birthDate: '1972-04-15', fullTimeSalary: 52_000, partTimeFactor: 1, accruedToDate: 5_000, asOf: '2026-11-18', retirementAge: 63,
  });
  assert.equal(result.retirementDate, '2035-04-15');
  assert.equal(result.yearsToRetirement, 9);
  assert.equal(result.futureAccrual, 5_426.64);
  assert.equal(result.earlyRetirementReduction, 0.325);
  assert.equal(result.unreducedAnnualPension, 10_426.64);
  assert.equal(result.projectedAnnualPension, 7_037.98);
});

test('projection accepts retirement ages 60 and 68', () => {
  const input = {
    birthDate: '1972-04-15', fullTimeSalary: 52_000, partTimeFactor: 1, accruedToDate: 5_000, asOf: '2026-11-18',
  };
  const early = projectPension({ ...input, retirementAge: 60 });
  assert.equal(early.yearsToRetirement, 6);
  assert.equal(early.futureAccrual, 3_617.76);
  assert.equal(early.earlyRetirementReduction, 0.52);
  assert.equal(early.unreducedAnnualPension, 8_617.76);
  assert.equal(early.projectedAnnualPension, 4_136.52);
  const standard = projectPension({ ...input, retirementAge: 68 });
  assert.equal(standard.earlyRetirementReduction, 0);
  assert.equal(standard.unreducedAnnualPension, standard.projectedAnnualPension);
});

test('projection rejects ages outside the range and non-integer ages', () => {
  const input = {
    birthDate: '1972-04-15', fullTimeSalary: 52_000, partTimeFactor: 1, accruedToDate: 0, asOf: '2026-11-18',
  };
  for (const retirementAge of [59, 69, 63.5]) {
    assert.throws(() => projectPension({ ...input, retirementAge }), RangeError);
  }
});

test('projection compares retirement age with attained age on the projection date', () => {
  const input = {
    birthDate: '1966-11-19', fullTimeSalary: 52_000, partTimeFactor: 1, accruedToDate: 5_000, retirementAge: 60,
  };
  const result = projectPension({ ...input, asOf: '2026-11-18' });
  assert.equal(result.yearsToRetirement, 1);
  const atRetirement = projectPension({ ...input, asOf: '2026-11-19' });
  assert.equal(atRetirement.yearsToRetirement, 0);
  assert.equal(atRetirement.futureAccrual, 0);
  assert.throws(() => projectPension({ ...input, asOf: '2027-11-19' }), RangeError);
});
