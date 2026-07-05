/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system colors - mapped to Tailwind's utility classes
        primary: {
          DEFAULT: '#0080c8',
          hover: '#006da8',
          active: '#005a8c',
        },
        accent: {
          DEFAULT: '#92dce5',
          hover: '#7bc8d2',
          light: 'rgba(146, 220, 229, 0.3)',
        },
        background: '#f8f7f9',
        text: {
          DEFAULT: '#2b2d42',
          muted: 'rgba(43, 45, 66, 0.7)',
          light: 'rgba(43, 45, 66, 0.5)',
        },
        border: 'rgba(43, 45, 66, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(43,45,66,0.08), 0 1px 2px rgba(43,45,66,0.06)',
        'card-hover': '0 4px 6px rgba(43,45,66,0.1), 0 2px 4px rgba(43,45,66,0.06)',
      },
    },
  },
  plugins: [],
};