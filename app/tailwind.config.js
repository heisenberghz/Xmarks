/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        cardHover: 'rgb(var(--color-card-hover) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        borderHover: 'rgb(var(--color-border-hover) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          hover: 'rgb(var(--color-accent-hover) / <alpha-value>)',
          subtle: 'var(--color-accent-subtle)',
        },
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
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
