/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // Pure neutral zinc-950
        panel: '#121215',       // Pure neutral zinc-925
        card: '#18181b',        // Pure neutral zinc-900
        cardHover: '#202024',   // Flat neutral hover fill
        border: '#27272a',      // Pure neutral zinc-800 flat border (no glow)
        borderHover: '#3f3f46', // Pure neutral zinc-700
        accent: {
          DEFAULT: '#e4e4e7',   // Pure neutral zinc-200
          hover: '#ffffff',     // White
          subtle: '#27272a',    // Pure neutral zinc-800
        },
        muted: '#a1a1aa',       // Pure neutral zinc-400
        foreground: '#fafafa',  // Pure neutral zinc-50
        danger: '#ef4444',
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
