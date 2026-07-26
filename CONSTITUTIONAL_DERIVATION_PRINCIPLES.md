# Constitutional Derivation Principles (Constitutional Architecture)

**Status:** Permanent constitutional architecture document (Product Owner-required, 2026-07-25).
**Authority:** Product Owner Disposition — *Phase 7 Authorization Package: Approved* (2026-07-25), **Required Addition**.
**Companion to:** Authentication & Authority Principles (constitutional architecture). Where that document governs *who may act and who may approve*, this document governs *how constitutional state comes to exist* — derivation.
**Scope:** Durable platform doctrine. These principles govern every present and future SCS phase, and survive individual phases, baselines, and revisions. They may be changed only through an approved Product Owner supersession.

> This is architecture doctrine, not implementation. It authorizes no code, no server-side derivation engine, no deployment, no confidential data, and no launch. It records the constitutional principles that all derivation, command, versioning, and replay work must preserve. Phase 7 implementation remains **NOT authorized** and requires a separate Product Owner Phase 7 Implementation Authorization Directive.

---

## Why this document exists

SCS presents constitutional and organizational truth — who is activated, what carries authority, what contradicts what, how complete the platform is. That truth must be *derived* from authoritative records, never typed in, never guessed, never computed by whoever happens to be looking. As SCS moves the derivation engine to the server (Phase 7), the rules that keep derived truth trustworthy must be written down as permanent doctrine, at the same level of importance as the Authentication & Authority Principles — so that no future phase, optimization, or convenience can quietly erode them.

---

## The Ten Derivation Principles (non-negotiable)

1. **Constitutional state is derived, never edited directly.** Authoritative constitutional state (activation, authority status, contradictions, lifecycle, completion) is the *output* of derivation over authoritative records. No actor edits derived constitutional state as if it were a stored value. To change what is derived, change the authoritative inputs through a governed command — never the derived output.

2. **Derivation must be deterministic.** Given the same authoritative inputs, command history, and derivation version, derivation produces exactly the same constitutional state. No wall-clock time, randomness, locale, ordering accident, or environment may influence the result. Any input that could affect the output is passed explicitly and recorded.

3. **Derivation must be reproducible.** Any past constitutional state can be regenerated from its recorded authoritative inputs and its derivation version. Reproducibility is what makes constitutional truth reviewable, disputable, and defensible over time.

4. **Derivation must be explainable.** Every derived value traces to the specific authoritative inputs and the specific rule that produced it. "The system says so" is never sufficient; "these accepted records, under this rule, at this version, produce this" is the standard.

5. **Derivation must be versioned.** `derivation_version` (the rules) and `schema_version` (the shape) are governed separately and never merged into a single number. A change to derivation logic bumps `derivation_version` without silently reinterpreting history recorded under a prior version.

6. **Derivation must be attributable.** The inputs to derivation are authoritative records, and every authoritative record carries the authenticated actor and request identifier that produced it (Authentication & Authority Principles). Derived state inherits this accountability chain: it is always possible to say *whose* accepted actions produced a given constitutional truth.

7. **Derivation outputs are products of authoritative inputs.** Derived state has no independent existence and no independent authority. It is a pure function of authoritative inputs; it may be cached for performance but the cache is never a source of truth — only the recomputation from authoritative inputs is.

8. **Replay must produce identical constitutional state under the same inputs and derivation version.** Deterministic replay is a constitutional requirement, not a testing convenience. Given the same authoritative inputs, command history, and derivation version, the server reproduces the same constitutional state — every time, on any host.

9. **Clients never author constitutional derivation.** Clients present, cache, and propose. A client may compute presentation-only convenience state (sorting, filtering, layout, local UI), never authoritative constitutional state. No client-computed value may become, or masquerade as, constitutional truth. Any capability that would blur this boundary requires a Product Owner architectural review before it is built.

10. **AI may assist analysis but may never originate constitutional state.** An agent — regardless of role, capability, or model — may help design, analyze, or (under authorization) implement the derivation engine, but the *running server*, deriving from authoritative records, is the authority. No agent originates constitutional state, and no agent approves, accepts, activates, or elevates authority. This is continuous with the Authority Origin Rules: authority never originates from AI.

---

## The Derivation Boundary (permanent shape)

```
Authoritative records ──▶ [ Server-side derivation engine ] ──▶ Derived constitutional state
   (governed commands,        deterministic · versioned ·           (read-only outputs,
    PO approvals, history)     explainable · reproducible)           cached, never authored by clients)
                                          │
                                          ▼
                              Clients: present · cache · propose
                              Product Owner: approves authoritative inputs
```

- **The server derives.** Derivation is server-owned end-to-end: it reads authoritative records, derives, stamps the derivation version, and serves read-only outputs.
- **The client presents.** Clients render server-derived state and may cache it for display, reconciling to server truth. They propose changes through governed commands; they never author constitutional state.
- **The Product Owner approves.** Constitutional truth changes only when the Product Owner approves changes to *authoritative inputs*; derivation then faithfully reflects those inputs. Approval is never a derivation side effect.

---

## Relationship to authority (why this is separate from, and joined to, the Authority Principles)

The **Authentication & Authority Principles** answer: *who is acting, what may they do, and who may approve.* These **Constitutional Derivation Principles** answer: *how does constitutional truth come to exist, and how does it stay trustworthy over time.* They are joined at one point: **derivation reflects authority; it never creates it.** Derivation reads the results of authoritative, Product-Owner-approved actions and computes their consequences. It cannot elevate authority, cannot approve, and cannot substitute for the Product Owner. Authority flows from approved inputs into derived outputs — never the other way around.

---

## Durability

These principles are permanent. They are not a Phase 7 artifact; Phase 7 is merely the phase in which the platform grows into them. They bind every future phase, capability, migration, and optimization. Caching, performance work, new commands, new derived views, and new clients must all preserve them. They may be amended only through an approved Product Owner supersession — never by implementation convenience, never by an agent, never by a client, never silently.
