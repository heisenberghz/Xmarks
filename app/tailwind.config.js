/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#07080a', // Pitch-dark obsidian base (subtle dark depth, not hard blue)
        panel: '#0d0e12',       // Elevated dark panel
        card: '#111216',        // Deep dark card surface
        cardHover: '#16171d',   // Subtle dark hover fill
        border: '#1b1c22',      // Hairline dark border
        borderHover: '#282a33', // Active/hover border
        accent: {
          DEFAULT: '#94a3b8',   // Refined cool steel slate (no saturated neon blue)
          hover: '#cbd5e1',
          subtle: 'rgba(148, 163, 184, 0.08)',
        },
        muted: '#787f8f',       // Restrained cool slate text
        foreground: '#f1f3f7',  // Crisp off-white
        danger: '#f85149',
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        none: 'none',
        card: 'none',
        'card-hover': 'none',
        xs: 'none',
        sm: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
      },
    },
  },
  plugins: [],
};
