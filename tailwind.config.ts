// @ts-ignore
import ecaLight from '@ecainternational/eca-design-tokens/tailwind/eca-light-theme.tailwind.js';
// @ts-ignore
import ecaDark from '@ecainternational/eca-design-tokens/tailwind/eca-dark-theme.tailwind.js';
const { createThemes } = require('tw-colors');

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
    './node_modules/@ecainternational/eca-components/**/*.js',
  ],
  safelist: [
    {
      pattern:
        /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-5',
    'grid-cols-6',
    'grid-cols-7',
    'grid-cols-8',
    'col-span-1',
    'col-span-2',
    'col-span-3',
    'col-span-4',
    'col-span-5',
    'col-span-6',
    'col-span-7',
    'col-span-8',
  ],
  plugins: [
    require('@headlessui/tailwindcss'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('tailwindcss-animate'),
    require('@ecainternational/eca-components'),
    require('@tailwindcss/container-queries'),
    createThemes(
      {
        'eca-light': ecaLight,
        'eca-dark': ecaDark,
      },
      {
        defaultTheme: 'eca-light',
      },
    ),
  ],
  theme: {
    extend: {
      boxShadow: {
        'row-highlight': 'inset 0 1px 0 0',
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'var(--colors-neutral-content-default)',
            '--tw-prose-headings': 'var(--colors-neutral-content-boldest)',
            '--tw-prose-invert-body': 'var(--colors-neutral-content-default)',
            '--tw-prose-invert-headings': 'var(--colors-neutral-content-boldest)',
          },
        },
      },
    },
  },
};

export default config;