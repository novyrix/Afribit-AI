/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:            '#0B0B0F',
        surface:       '#141414',
        'bitcoin':     '#F7931A',
        'bitcoin-dim': '#1A0D00',
        positive:      '#00C896',
        negative:      '#FF4D4D',
        // legacy aliases kept for safety during migration
        'bitcoin-orange': '#F7931A',
        'bitcoin-dark':   '#0B0B0F',
        'bitcoin-card':   '#141414',
      },
      fontFamily: {
        display: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Segoe UI"',
          'system-ui',
          'sans-serif',
        ],
        text: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Segoe UI"',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          '"SF Mono"',
          'Menlo',
          'monospace',
        ],
      },
      fontSize: {
        // Apple HIG-aligned sizes; numeric values are pt-equivalents (1pt = 1px on web)
        '11': ['11px', { lineHeight: '14px' }],
        '12': ['12px', { lineHeight: '16px' }],
        '13': ['13px', { lineHeight: '18px' }],
        '14': ['14px', { lineHeight: '20px' }],
        '15': ['15px', { lineHeight: '22px' }],
        '17': ['17px', { lineHeight: '24px' }],
        '18': ['18px', { lineHeight: '24px' }],
        '20': ['20px', { lineHeight: '26px' }],
        '22': ['22px', { lineHeight: '28px' }],
        '24': ['24px', { lineHeight: '30px' }],
        '28': ['28px', { lineHeight: '34px' }],
        '34': ['34px', { lineHeight: '40px' }],
        '44': ['44px', { lineHeight: '48px', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        glass:    '14px',
        card:     '20px',
        wallet:   '22px',
        pill:     '999px',
      },
      spacing: {
        // 8pt grid additions
        '13': '52px',
        '15': '60px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
