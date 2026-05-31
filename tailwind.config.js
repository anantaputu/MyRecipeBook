/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#050816',
          900: '#0d1328',
          800: '#18203b',
        },
        mist: {
          100: '#f6f7fb',
          200: '#e9ecf5',
          300: '#c8d1e5',
        },
        accent: {
          400: '#51a2ff',
          500: '#2f7cf6',
          600: '#1b59db',
        },
      },
      boxShadow: {
        cover: '0 30px 80px rgba(7, 14, 35, 0.45)',
        panel: '0 20px 60px rgba(12, 18, 38, 0.14)',
      },
      backgroundImage: {
        'hero-gradient':
          'radial-gradient(circle at top, rgba(95, 138, 255, 0.22), transparent 34%), linear-gradient(180deg, #131b33 0%, #090d1d 100%)',
        'paper-gradient':
          'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(246,247,251,1) 100%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
