import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { projectPension } from '../src/domain/pension.ts';
import { startTestServer } from './helpers.ts';

const base = { birthDate: '1966-06-30', fullTimeSalary: 98_000, partTimeFactor: 0.8, accruedToDate: 10_000, asOf: '2026-11-18' };

describe('early retirement (BL-02)', () => {
  test('standard age has no reduction', () => {
    const r = projectPension({ ...base, retirementAge: 68 });
    assert.equal(r.earlyRetirementReduction, 0);
    assert.equal(r.projectedAnnualPension, r.unreducedAnnualPension);
  });

  test('retiring at 63 stops accrual and applies 5 × 6.5% reduction', () => {
    const r = projectPension({ ...base, retirementAge: 63 });
    assert.equal(r.yearsToRetirement, 3);
    assert.equal(r.earlyRetirementReduction, 0.325);
    assert.equal(r.futureAccrual, 3_379.11);
    assert.equal(r.unreducedAnnualPension, 13_379.11);
    assert.equal(r.projectedAnnualPension, 9_030.9);
    assert.equal(r.retirementDate, '2029-06-30');
  });

  test('minimum early retirement age is 60', () => {
    assert.throws(() => projectPension({ ...base, retirementAge: 59 }), /between 60 and 68/);
  });

  test('retirement age above the standard age is rejected', () => {
    assert.throws(() => projectPension({ ...base, retirementAge: 69 }), /between 60 and 68/);
  });

  test('retirement age below the current age is rejected', () => {
    assert.throws(() => projectPension({ ...base, birthDate: '1960-01-01', retirementAge: 62 }), /below the member's current age/);
  });
});

describe('POST /api/projections with early retirement', () => {
  let api: Awaited<ReturnType<typeof startTestServer>>;
  before(async () => { api = await startTestServer(); });
  after(async () => { await api.close(); });

  test('returns a reduced projection for M-1004 at 63', async () => {
    const res = await api.post('/api/projections', { memberId: 'M-1004', retirementAge: 63 });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.earlyRetirementReduction, 0.325);
    assert.ok(body.projectedAnnualPension < body.unreducedAnnualPension);
  });

  test('returns 422 below the minimum age', async () => {
    const res = await api.post('/api/projections', { memberId: 'M-1004', retirementAge: 59 });
    assert.equal(res.status, 422);
  });
});
