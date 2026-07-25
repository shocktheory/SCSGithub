import { describe, expect, it, beforeAll } from 'vitest';
import { createHmac } from 'node:crypto';

/**
 * Phase 6 E2E — Identity/Authority/Trust against the ACTUAL running PHP/MySQL backend.
 * Gated by SCS_E2E_BASE (skips locally; runs in CI). Exercises login+MFA, secure session cookie,
 * CSRF, the Product-Owner-only approval boundary, and the mandatory rejection scenarios.
 */
const BASE = process.env.SCS_E2E_BASE;

// RFC 6238 TOTP (to authenticate as the seeded Product Owner).
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
const cookieOf = (res: Response) => (res.headers.get('set-cookie') ?? '').split(';')[0]; // scs_session=...
const auth = (cookie: string, csrf?: string) => ({ Cookie: cookie, 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) });

describe.skipIf(!BASE)('Phase 6 E2E — identity, authority boundary, trust', () => {
  let poMfaSecret = '';
  beforeAll(async () => {
    await api('/api/admin/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmationToken: 'CONFIRM-RESET' }) });
    const seed = await (await api('/api/auth/dev-seed', { method: 'POST' })).json();
    poMfaSecret = seed.poMfaSecret;
    expect(poMfaSecret).toBeTruthy();
  });

  it('Product Owner login requires MFA, then succeeds', async () => {
    const noMfa = await api('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'po@scs.test', password: 'po-password' }) });
    expect(noMfa.status).toBe(401);
    expect((await noMfa.json()).error).toBe('mfa_required');

    const ok = await api('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'po@scs.test', password: 'po-password', totp: totp(poMfaSecret) }) });
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body.user.role).toBe('product_owner');
    expect(cookieOf(ok)).toMatch(/^scs_session=/);
  });

  it('only the authenticated Product Owner may approve; agents and unauth are denied', async () => {
    // PO session
    const login = await api('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'po@scs.test', password: 'po-password', totp: totp(poMfaSecret) }) });
    const poCookie = cookieOf(login); const poCsrf = (await login.json()).csrfToken;

    // PO proposes then approves a record.
    const up = await api('/api/commands/upsert', { method: 'POST', headers: auth(poCookie, poCsrf), body: JSON.stringify({ collection: 'products', record: { id: 'e2e1', name: 'X' } }) });
    expect(up.status).toBe(200);
    const approve = await api('/api/commands/approve', { method: 'POST', headers: auth(poCookie, poCsrf), body: JSON.stringify({ collection: 'products', id: 'e2e1', transition: 'approved' }) });
    expect(approve.status).toBe(200);
    const rec = await (await api('/api/products/e2e1')).json();
    expect(rec.record.authorityStatus).toBe('approved');

    // Forged/missing CSRF is rejected for an authenticated write.
    const badCsrf = await api('/api/commands/approve', { method: 'POST', headers: auth(poCookie, 'WRONG'), body: JSON.stringify({ collection: 'products', id: 'e2e1' }) });
    expect(badCsrf.status).toBe(403);

    // Agent cannot approve, and cannot elevate authority via upsert.
    const aLogin = await api('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'agent@scs.test', password: 'agent-password' }) });
    const aCookie = cookieOf(aLogin); const aCsrf = (await aLogin.json()).csrfToken;
    const aApprove = await api('/api/commands/approve', { method: 'POST', headers: auth(aCookie, aCsrf), body: JSON.stringify({ collection: 'products', id: 'e2e1' }) });
    expect(aApprove.status).toBe(403);
    const aElevate = await api('/api/commands/upsert', { method: 'POST', headers: auth(aCookie, aCsrf), body: JSON.stringify({ collection: 'products', record: { id: 'e2e2', authorityStatus: 'approved' } }) });
    expect(aElevate.status).toBe(403);

    // Unauthenticated approval is denied.
    const anon = await api('/api/commands/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collection: 'products', id: 'e2e1' }) });
    expect(anon.status).toBe(401);
  });

  it('logout ends the session', async () => {
    const login = await api('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'po@scs.test', password: 'po-password', totp: totp(poMfaSecret) }) });
    const cookie = cookieOf(login);
    await api('/api/auth/logout', { method: 'POST', headers: auth(cookie) });
    const session = await (await api('/api/auth/session', { headers: auth(cookie) })).json();
    expect(session.authenticated).toBe(false);
  });
});
