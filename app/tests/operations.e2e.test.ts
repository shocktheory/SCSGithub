import { describe, expect, it, beforeAll } from 'vitest';

/**
 * Phase 9 E2E — Constitutional Operational Awareness against the ACTUAL running PHP/MySQL backend.
 * Gated by SCS_E2E_BASE (skips locally; runs in CI). Exercises the derived read-only operational
 * model, Notification History (append-only, distinct stream), and the never-authority invariant.
 */
const BASE = process.env.SCS_E2E_BASE;
const api = (path: string, init: RequestInit = {}) => fetch(`${BASE}${path}`, init);
const json = (body: unknown) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe.skipIf(!BASE)('Phase 9 E2E — operational awareness (derived, read-only; never authority)', () => {
  beforeAll(async () => {
    await api('/api/admin/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmationToken: 'CONFIRM-RESET' }) });
    // Seed one in-review deliverable and one open gate directly (import path; no auth needed for admin reset+import in dev/test).
    await api('/api/admin/import', json({ schemaVersion: '0.1.0', exportedAt: 'x', isSeed: true, collections: {
      deliverables: [{ id: 'd1', deliverableId: 'ST-DLV-E2E', status: 'In review' }],
      gates: [{ id: 'g1', name: 'E2E Review', status: 'Open — pending Product Owner review' }],
    } }));
  });

  it('operational awareness is derived, read-only, and server-sourced', async () => {
    const res = await api('/api/derived/operations');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('server');
    expect(body.readOnly).toBe(true);
    expect(body.view).toBe('operations');
    expect(Array.isArray(body.notifications)).toBe(true);
    // Workflow state is reported distinctly from constitutional state.
    const dlv = body.workflowStates.find((w: { kind: string; id: string }) => w.kind === 'deliverable' && w.id === 'd1');
    expect(dlv.workflowState).toBe('awaiting-review');
    expect(dlv.constitutionalState).not.toBe('awaiting-review');
  });

  it('generating notifications records to an append-only, deduped history — never authority', async () => {
    const gen1 = await (await api('/api/notifications/generate', json({}))).json();
    expect(gen1.derived).toBeGreaterThan(0);
    const first = gen1.newlyRecorded;
    expect(first).toBeGreaterThan(0);
    // Re-generating surfaces the same derived notifications but records no duplicates (dedupe).
    const gen2 = await (await api('/api/notifications/generate', json({}))).json();
    expect(gen2.newlyRecorded).toBe(0);
    const hist = await (await api('/api/notifications')).json();
    expect(hist.count).toBe(first);
    // Generating notifications changed no governed record — the deliverable is still non-authoritative.
    const dlv = await (await api('/api/deliverables/d1')).json();
    expect(dlv.record.authorityStatus === undefined || dlv.record.authorityStatus === 'reported').toBe(true);
  });

  it('the Operational Dashboard model is distinct from the Governance Dashboard model', async () => {
    const ops = await (await api('/api/derived/operations')).json();
    const gov = await (await api('/api/derived/governance')).json();
    expect(ops.view).toBe('operations');
    expect(gov.view).toBe('governance');
    expect(ops).toHaveProperty('workflowStates');       // operations concept
    expect(gov.governance).toHaveProperty('constitutionalHealth'); // governance concept
    expect(ops).not.toHaveProperty('governance');
  });
});
