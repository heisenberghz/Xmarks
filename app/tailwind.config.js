/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0e0e12',
        panel: '#161619',
        card: '#1c1c21',
        cardHover: '#242429',
        border: '#2a2a30',
        borderHover: '#3a3a42',
        accent: {
          DEFAULT: '#14B8A6',
          hover: '#0D9488',
          subtle: '#0a2420',
        },
        muted: '#8a8a96',
        foreground: '#ececf0',
        danger: '#EF4444',
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
