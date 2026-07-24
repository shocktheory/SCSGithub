import type { Config } from 'tailwindcss';

// SCS design tokens are the single source of truth for color/spacing/radius/motion.
// Tailwind reads them from CSS variables (see src/design-system/tokens.css) so the
// same tokens drive utilities, dark mode, and hand-written component CSS.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Operating-environment blue/indigo system (SCS owns blue; ShockTheory owns green).
        'electric-blue': 'var(--color-electric-blue)',
        'steel-blue': 'var(--color-steel-blue)',
        'soft-sky': 'var(--color-soft-sky)',
        periwinkle: 'var(--color-periwinkle)',
        'deep-navy': 'var(--color-deep-navy)',
        'midnight-slate': 'var(--color-midnight-slate)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        control: 'var(--radius-control)',
      },
      transitionTimingFunction: {
        scs: 'var(--ease-scs)',
      },
      transitionDuration: {
        scs: 'var(--duration-scs)',
      },
    },
  },
  plugins: [],
} satisfies Config;
