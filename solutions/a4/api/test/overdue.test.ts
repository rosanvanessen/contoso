import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { daysOverdue, dueDate } from '../src/domain/serviceLevels.ts';
import { startTestServer } from './helpers.ts';

describe('service levels (BL-03)', () => {
  test('due date adds the SLA days of the category', () => {
    assert.equal(dueDate({ category: 'retirement-quote', createdAt: '2026-10-20' }), '2026-10-30');
  });

  test('closed requests are never overdue', () => {
    assert.equal(daysOverdue({ category: 'address-change', createdAt: '2026-01-01', status: 'closed' }, '2026-11-18'), 0);
  });

  test('a request is not overdue on its due date', () => {
    assert.equal(daysOverdue({ category: 'complaint', createdAt: '2026-11-04', status: 'open' }, '2026-11-18'), 0);
  });
});

describe('GET /api/service-requests/overdue', () => {
  let api: Awaited<ReturnType<typeof startTestServer>>;
  before(async () => { api = await startTestServer('2026-11-18'); });
  after(async () => { await api.close(); });

  test('returns overdue requests, most overdue first', async () => {
    const res = await api.get('/api/service-requests/overdue');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.map((r: { id: string; daysOverdue: number }) => [r.id, r.daysOverdue]), [
      ['SR-5004', 34], ['SR-5001', 19], ['SR-5003', 11], ['SR-5006', 3], ['SR-5005', 2],
    ]);
  });

  test('accepts an asOf date', async () => {
    const body = await (await api.get('/api/service-requests/overdue?asOf=2026-10-16')).json();
    assert.deepEqual(body.map((r: { id: string }) => r.id), ['SR-5004']);
  });

  test('rejects an invalid asOf', async () => {
    const res = await api.get('/api/service-requests/overdue?asOf=yesterday');
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, 'BAD_REQUEST');
  });
});
