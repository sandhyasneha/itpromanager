/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: '#0a0c10',
        surface: '#111318',
        surface2: '#181c24',
        border: '#1e2330',
        accent: '#00d4ff',
        accent2: '#7c3aed',
        accent3: '#10b981',
        warn: '#f59e0b',
        danger: '#ef4444',
        card: '#13161e',
      },
    },
  },
  plugins: [],
}
