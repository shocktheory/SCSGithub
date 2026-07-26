import { describe, expect, it } from 'vitest';
import { deriveAgentState, type DeriveInput } from '../src/lib/derivation';

/**
 * Phase 7 E2E — Client/Server derivation PARITY against the ACTUAL running PHP/MySQL backend.
 * Gated by SCS_E2E_BASE (skips locally; runs in CI).
 *
 * This is the constitutional guarantee of the Phase 7 migration: the server is the sole derivation
 * authority, and its output is IDENTICAL to the (now presentation-only) client engine for the same
 * authoritative input. If these ever diverge, the migration has changed constitutional truth — a
 * drift the test must catch.
 */
const BASE = process.env.SCS_E2E_BASE;
const api = (path: string, init: RequestInit = {}) => fetch(`${BASE}${path}`, init);
const json = (body: unknown) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// Golden fixtures spanning the derivation branches (Available, Pending, Working, contradiction).
const FIXTURES: Record<string, DeriveInput> = {
  available: {
    agentName: '#X',
    standingDirective: { id: 'ST-SD-005', version: 'v1', status: 'Current' },
    productOwnerAuthority: { id: 'ST-DEC-2026-008', approved: true },
    activationEventIds: ['ST-OPH-2026-004'],
    teamMembership: { label: 'TEAM-001 — Active', active: true },
  },
  pendingOnboarding: {
    agentName: '#Y',
    productOwnerAuthority: { id: 'x', approved: false },
    activationEventIds: [],
  },
  working: {
    agentName: '#Z',
    standingDirective: { id: 'ST-SD-006', version: 'v1', status: 'Current' },
    productOwnerAuthority: { id: 'ST-DEC-2026-009', approved: true },
    activationEventIds: ['ST-OPH-2026-012'],
    teamMembership: { label: 'TEAM-001 — Active', active: true },
    activeAssignmentDirective: { directiveId: 'ST-ADR-2026-005', title: 'Research', status: 'Active', deliverable: 'D', reviewGate: 'Gate' },
  },
  contradiction: {
    agentName: '#C',
    standingDirective: { id: 'ST-SD-007', version: 'v1', status: 'Current' },
    productOwnerAuthority: { id: 'd', approved: true },
    activationEventIds: ['e'],
    membershipConflict: true,
    conflictingMemberships: ['TM-1 → TEAM-001', 'TM-2 → TEAM-002'],
  },
};

describe.skipIf(!BASE)('Phase 7 E2E — server is the sole derivation authority; client/server parity', () => {
  it('exposes independent derivation_version and schema_version', async () => {
    const res = await api('/api/derivation/version');
    expect(res.status).toBe(200);
    const v = await res.json();
    expect(v.source).toBe('server');
    expect(typeof v.derivationVersion).toBe('string');
    expect(typeof v.schemaVersion).toBe('string');
  });

  it('server derivation is byte-for-byte identical to the client engine (parity)', async () => {
    for (const [name, input] of Object.entries(FIXTURES)) {
      const res = await api('/api/derived/agent-state', json({ input }));
      expect(res.status, name).toBe(200);
      const body = await res.json();
      expect(body.source, name).toBe('server');
      // The core constitutional guarantee: server output === client output for the same input.
      expect(body.state, `parity mismatch for fixture "${name}"`).toEqual(deriveAgentState(input));
      expect(typeof body.inputHash, name).toBe('string');
    }
  });

  it('deterministic replay reproduces the stored derivation (no drift)', async () => {
    const input = FIXTURES.available;
    await api('/api/derived/agent-state', json({ input }));           // store it
    const res = await api('/api/replay', json({ view: 'agent-state', input }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reproduced).toBe(true);
    expect(body.output).toEqual(deriveAgentState(input));
  });

  it('an incompatible derivation_version is a predictable 409 (mandatory regression)', async () => {
    const res = await api('/api/derived/agent-state', json({ input: FIXTURES.available, derivationVersion: '99.0.0' }));
    expect(res.status).toBe(409);
  });

  it('the team view derives on the server and is not client-authored', async () => {
    const res = await api('/api/derived/team');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('server');
    expect(body.view).toBe('team');
    expect(body).toHaveProperty('derivationVersion');
    expect(body).toHaveProperty('inputHash');
    expect(body.output).toHaveProperty('agents');
  });
});
