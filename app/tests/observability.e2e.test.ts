import { describe, expect, it, beforeAll } from 'vitest';
import { createHmac } from 'node:crypto';

/**
 * Phase 8 E2E — Constitutional Observability against the ACTUAL running PHP/MySQL backend.
 * Gated by SCS_E2E_BASE (skips locally; runs in CI). Exercises the Technical Audit Log integrity,
 * governance visibility (derived/read-only), and Constitutional Evidence immutability-once-accepted.
 */
const BASE = process.env.SCS_E2E_BASE;

function base32Decode(b32: string): Buffer {
  const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0; const out: number[] = [];
  for (const ch of b32.replace(/=+$/, '').toUpperCase()) {
    const i = a.indexOf(ch); if (i < 0) continue;
    value = (value << 5) | i; bits += 5;
    if (bits >= 8) { out.push((value >> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(out);
}
function totp(secret: string, now = Math.floor(Date.now() / 1000)): string {
  const counter = Math.floor(now / 30);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const h = createHmac('sha1', base32Decode(secret)).update(buf).digest();
  const off = h[h.length - 1] & 0xf;
  const code = (((h[off] & 0x7f) << 24) | ((h[off + 1] & 0xff) << 16) | ((h[off + 2] & 0xff) << 8) | (h[off + 3] & 0xff)) % 1_000_000;
  return code.toString().padStart(6, '0');
}

const api = (path: string, init: RequestInit = {}) => fetch(`${BASE}${path}`, init);
const cookieOf = (res: Response) => (res.headers.get('set-cookie') ?? '').split(';')[0];
const auth = (cookie: string, csrf?: string) => ({ Cookie: cookie, 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) });

describe.skipIf(!BASE)('Phase 8 E2E — constitutional observability (audit · evidence · governance)', () => {
  let poCookie = '', poCsrf = '';
  beforeAll(async () => {
    await api('/api/admin/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmationToken: 'CONFIRM-RESET' }) });
    const seed = await (await api('/api/auth/dev-seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
    const login = await api('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'po@scs.test', password: 'po-password', totp: totp(seed.poMfaSecret) }) });
    poCookie = cookieOf(login);
    poCsrf = (await login.json()).csrfToken;
  });

  it('governance visibility is derived, read-only, and server-sourced', async () => {
    const res = await api('/api/derived/governance');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('server');
    expect(body.readOnly).toBe(true);
    expect(body.governance).toHaveProperty('constitutionalHealth');
    expect(body.governance).toHaveProperty('reviewQueue');
  });

  it('the Technical Audit Log is append-only and independently verifiable', async () => {
    // Generate some governed activity, then verify the hash-chain.
    await api('/api/commands/propose', { method: 'POST', headers: auth(poCookie, poCsrf), body: JSON.stringify({ collection: 'products', record: { id: 'o1', name: 'X' } }) });
    await api('/api/commands/approve', { method: 'POST', headers: auth(poCookie, poCsrf), body: JSON.stringify({ collection: 'products', id: 'o1' }) });
    const audit = await (await api('/api/audit')).json();
    expect(audit.count).toBeGreaterThan(0);
    const verify = await (await api('/api/audit/verify')).json();
    expect(verify.ok).toBe(true);
    expect(verify.brokenAt).toBeNull();
  });

  it('Constitutional Evidence is immutable once accepted (supports decisions, never authority)', async () => {
    const h = auth(poCookie, poCsrf);
    expect((await api('/api/commands/propose', { method: 'POST', headers: h, body: JSON.stringify({ collection: 'evidence', record: { id: 'e1', kind: 'test', summary: 'ci' } }) })).status).toBe(200);
    expect((await api('/api/commands/approve', { method: 'POST', headers: h, body: JSON.stringify({ collection: 'evidence', id: 'e1' }) })).status).toBe(200);
    expect((await api('/api/commands/accept', { method: 'POST', headers: h, body: JSON.stringify({ collection: 'evidence', id: 'e1' }) })).status).toBe(200);
    // Immutable once accepted — a plain write is refused.
    const mutate = await api('/api/commands/upsert', { method: 'POST', headers: h, body: JSON.stringify({ collection: 'evidence', record: { id: 'e1', summary: 'altered' } }) });
    expect(mutate.status).toBe(403);
    // Evidence cannot self-elevate to authority.
    const elevate = await api('/api/commands/propose', { method: 'POST', headers: h, body: JSON.stringify({ collection: 'evidence', record: { id: 'e2', authorityStatus: 'approved' } }) });
    expect(elevate.status).toBe(403);
  });
});
