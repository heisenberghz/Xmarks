/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090d11',
        panel: '#11161d',
        card: '#161c24',
        cardHover: '#1c242f',
        border: '#222a36',
        borderHover: '#333f50',
        accent: {
          DEFAULT: '#1d9bf0',
          hover: '#1a8cd8',
          subtle: '#0c2738',
        },
        muted: '#768390',
        foreground: '#e6edf3',
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '3px',
        md: '4px',
        lg: '6px',
      },
    },
  },
  plugins: [],
};
