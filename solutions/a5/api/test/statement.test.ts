import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers.ts';

describe('annual statement for part-time members (BL-01)', () => {
  let api: Awaited<ReturnType<typeof startTestServer>>;
  before(async () => { api = await startTestServer(); });
  after(async () => { await api.close(); });

  test('M-1003 (60% part-time) uses the part-time factor', async () => {
    const statement = await (await api.get('/api/members/M-1003/statement')).json();
    assert.equal(statement.currentPensionableSalary, 17_073);
    assert.equal(statement.currentYearAccrual, 298.78);
  });

  test('M-1001 (full-time) is unchanged', async () => {
    const statement = await (await api.get('/api/members/M-1001/statement')).json();
    assert.equal(statement.currentPensionableSalary, 34_455);
  });
});
