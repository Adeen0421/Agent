/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Black-Blue theme colors
        'black-blue': {
          primary: 'var(--black-blue-primary)',
          secondary: 'var(--black-blue-secondary)',
          tertiary: 'var(--black-blue-tertiary)',
          quaternary: 'var(--black-blue-quaternary)',
          light: 'var(--black-blue-light)',
          accent: 'var(--black-blue-accent)',
          glass: 'var(--black-blue-glass)',
          'glass-light': 'var(--black-blue-glass-light)',
          text: 'var(--black-blue-text)',
          'text-muted': 'var(--black-blue-text-muted)',
          dark: 'var(--black-blue-dark)',
        }
      },
      backgroundColor: {
        'black-blue-primary': 'var(--black-blue-primary)',
        'black-blue-secondary': 'var(--black-blue-secondary)',
        'black-blue-tertiary': 'var(--black-blue-tertiary)',
        'black-blue-quaternary': 'var(--black-blue-quaternary)',
        'black-blue-light': 'var(--black-blue-light)',
        'black-blue-accent': 'var(--black-blue-accent)',
      },
      borderColor: {
        'black-blue-glass': 'var(--black-blue-glass-border)',
        'black-blue-light': 'var(--black-blue-light)',
      },
      boxShadow: {
        'black-blue-sm': '0 2px 8px var(--black-blue-glow)',
        'black-blue-md': '0 4px 20px rgba(0, 119, 182, 0.3)',
        'black-blue-lg': '0 8px 30px rgba(0, 180, 216, 0.2)',
        'black-blue-xl': '0 20px 50px rgba(0, 8, 20, 0.8)',
        'glow-black-blue': '0 0 25px var(--black-blue-glow)',
        'glow-black-blue-accent': '0 0 20px rgba(144, 224, 239, 0.4)',
        'glow-black-blue-intense': '0 0 40px var(--black-blue-light)',
      },
    },
  },
  plugins: [],
}
