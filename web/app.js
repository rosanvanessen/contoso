// Contoso Member Services UI — plain ES modules, no build step.
const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const pct = (n) => `${Math.round(n * 100)}%`;
const $ = (sel) => document.querySelector(sel);

let employers = new Map();
let selectedMember = null;

async function api(path, options) {
  const res = await fetch(path, options);
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  return body;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

async function loadMembers() {
  const status = $('#status-filter').value;
  const members = await api(`/api/members${status ? `?status=${status}` : ''}`);
  $('#members-table tbody').innerHTML = members.map((m) => `
    <tr data-id="${m.id}" tabindex="0">
      <td>${m.id}</td>
      <td>${escapeHtml(m.firstName)} ${escapeHtml(m.lastName)}</td>
      <td>${escapeHtml(employers.get(m.employerId)?.name ?? m.employerId)}</td>
      <td>${pct(m.partTimeFactor)}</td>
      <td><span class="badge ${m.status}">${m.status}</span></td>
    </tr>`).join('');
}

async function showMember(id) {
  selectedMember = await api(`/api/members/${id}`);
  const [statement, contributions] = await Promise.all([
    api(`/api/members/${id}/statement`),
    api(`/api/members/${id}/contributions`),
  ]);
  $('#member-detail').hidden = false;
  $('#detail-title').textContent = `${selectedMember.firstName} ${selectedMember.lastName} · ${id}`;
  const card = (label, value) => `<div class="card"><span>${label}</span><strong>${value}</strong></div>`;
  $('#statement-cards').innerHTML = [
    card('Age', statement.age),
    card('Years of service', statement.yearsOfService),
    card('Accrued pension / year', euro.format(statement.accruedPension)),
    card('Pensionable salary (current)', euro.format(statement.currentPensionableSalary)),
    card('Accrual this year', euro.format(statement.currentYearAccrual)),
    card(`Projected at ${statement.retirementDate}`, euro.format(statement.projectedPensionAtRetirement)),
  ].join('');
  $('#retirement-age').innerHTML = [60, 61, 62, 63, 64, 65, 66, 67, 68]
    .map((a) => `<option value="${a}" ${a === 68 ? 'selected' : ''}>${a}</option>`).join('');
  $('#projection-result').textContent = '';
  $('#contributions-table tbody').innerHTML = contributions.map((c) => `
    <tr><td>${c.year}</td><td>${euro.format(c.fullTimeSalary)}</td><td>${pct(c.partTimeFactor)}</td>
    <td>${euro.format(c.pensionableSalary)}</td><td>${euro.format(c.accrual)}</td>
    <td>${euro.format(c.employerContribution)}</td><td>${euro.format(c.employeeContribution)}</td></tr>`).join('');
}

async function project(event) {
  event.preventDefault();
  const out = $('#projection-result');
  try {
    const result = await api('/api/projections', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        memberId: selectedMember.id,
        retirementAge: Number($('#retirement-age').value),
        salaryGrowthRate: Number($('#salary-growth').value),
      }),
    });
    out.className = 'result ok';
    out.textContent = `Projected yearly pension at ${result.retirementAge} (${result.retirementDate}): ${euro.format(result.projectedAnnualPension)} — accrued ${euro.format(result.accruedToDate)} + future ${euro.format(result.futureAccrual)}`;
  } catch (err) {
    out.className = 'result error';
    out.textContent = `Projection failed: ${err.message}`;
  }
}

async function loadRequests() {
  const status = $('#request-status-filter').value;
  const requests = await api(`/api/service-requests${status ? `?status=${status}` : ''}`);
  $('#requests-table tbody').innerHTML = requests.map((r) => `
    <tr><td>${r.id}</td><td>${r.memberId}</td><td>${r.category}</td><td title="${escapeHtml(r.description)}">${escapeHtml(r.subject)}</td>
    <td><span class="badge ${r.status}">${r.status}</span></td><td>${r.createdAt}</td></tr>`).join('');
}

function switchView(view) {
  document.querySelectorAll('.tab').forEach((t) => {
    const active = t.dataset.view === view;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', String(active));
  });
  $('#view-members').hidden = view !== 'members';
  $('#view-requests').hidden = view !== 'requests';
  if (view === 'requests') loadRequests();
}

async function init() {
  employers = new Map((await api('/api/employers')).map((e) => [e.id, e]));
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => switchView(t.dataset.view)));
  $('#status-filter').addEventListener('change', loadMembers);
  $('#request-status-filter').addEventListener('change', loadRequests);
  $('#projection-form').addEventListener('submit', project);
  $('#members-table tbody').addEventListener('click', (e) => {
    const row = e.target.closest('tr[data-id]');
    if (row) showMember(row.dataset.id);
  });
  $('#members-table tbody').addEventListener('keydown', (e) => {
    const row = e.target.closest('tr[data-id]');
    if (row && e.key === 'Enter') showMember(row.dataset.id);
  });
  await loadMembers();
}

init().catch((err) => { document.body.insertAdjacentHTML('afterbegin', `<p class="result error">Failed to load: ${escapeHtml(err.message)}</p>`); });
