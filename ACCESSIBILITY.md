# SCS Accessibility

Accessibility is a **constitutional requirement** (§19, §30), part of component behavior — not a
final patch. Target: **WCAG 2.2 AA**.

## Commitments

- Keyboard support with visible focus (`:focus-visible` ring in `index.css`).
- Semantic headings and landmark structure; correct reading order.
- Screen-reader labels on all interactive controls and status.
- **Non-color status meaning** — status is never color alone; always paired with label/icon.
- Large-text resilience (layouts survive 200% zoom / large text).
- **Reduced motion** fully supported — `prefers-reduced-motion` zeroes `--duration-scs`.
- Sufficient contrast; accessible dialogs (Radix primitives); accessible tables.
- Touch-target sizing (≥44×44 CSS px on touch).

## Contrast validation (2026-07-24)

Validated against WCAG 2.2 AA thresholds — normal text ≥ 4.5:1, large text / UI & graphics ≥ 3.0:1.
Backgrounds: base `#12161F`/Deep Navy `#161B25`; surface Midnight Slate `#203763`.

| Foreground | On | Ratio | Normal | Large/UI |
|---|---|---|---|---|
| Text primary `#F9F9F9` | Deep Navy | 16.4:1 | ✅ | ✅ |
| Text secondary `#B9B9B9` | Deep Navy | 8.8:1 | ✅ | ✅ |
| Text secondary `#B9B9B9` | Midnight Slate | 6.0:1 | ✅ | ✅ |
| **Text muted `#8A93A6`** (new) | Deep Navy | 5.6:1 | ✅ | ✅ |
| ~~`#444750`~~ (benchmark muted) | Deep Navy | 1.86:1 | ❌ | ❌ |
| Electric Blue `#418FFF` (link) | Deep Navy | 5.4:1 | ✅ | ✅ |
| Electric Blue `#418FFF` | Midnight Slate | 3.7:1 | ❌ | ✅ |
| Soft Periwinkle `#8FA9FF` | Deep Navy | 7.6:1 | ✅ | ✅ |
| Soft Sky `#81B8E7` | Deep Navy | 8.2:1 | ✅ | ✅ |
| Deep Navy text | Electric Blue (CTA) | 5.4:1 | ✅ | ✅ |
| Deep Navy text | Soft Periwinkle | 7.6:1 | ✅ | ✅ |
| ~~White text~~ | Electric Blue (CTA) | 3.2:1 | ❌ | ✅ |
| White text | Steel Blue | 5.7:1 | ✅ | ✅ |

### Rules derived

1. `#444750` is a **border/divider token only** — never text. Muted text = `#8A93A6`.
2. **Primary CTA** = blue gradient with **deep-navy** text (not white).
3. Electric-blue **text** on surfaces (Midnight Slate) only at large sizes / for icons; small accent
   text on surfaces uses Soft Sky / Periwinkle. White-text buttons use Steel Blue, not Electric Blue.

## Verification approach

- Automated: `@axe-core/playwright` runs in e2e (Phase 4 gate).
- Manual: keyboard-only pass, VoiceOver pass, 200% zoom pass per feature before it ships.
- Every new color pairing must be added to the table above with its measured ratio.
