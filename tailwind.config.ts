import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'slate-base': '#0b1220',
        'slate-panel': '#162033',
        'slate-quiet': '#0f172a',
        'ow-orange': '#F99E1A',
        'ow-orange-dim': '#C77A0F',
        'ow-orange-glow': 'rgba(249, 158, 26, 0.45)',
        'role-tank': '#3b82f6',
        'role-dps': '#ef4444',
        'role-support': '#22c55e',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'panel': '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.55)',
        'panel-elevated':
          '0 1px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px rgba(249,158,26,0.05), 0 16px 40px -16px rgba(0,0,0,0.7)',
        'glow-orange': '0 0 14px rgba(249, 158, 26, 0.5)',
      },
    },
  },
  plugins: [],
} satisfies Config;
