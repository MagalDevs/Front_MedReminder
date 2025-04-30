/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#BE185D', // Cor do logotipo (rosa/vermelho)
          teal: '#0D9488',    // Cor do logotipo (verde/turquesa)
        },
      },
      fontFamily: {
        kantumruy: ['KantumruyProRegular', 'sans-serif'],
        kantumruyMedium: ['KantumruyProMedium', 'sans-serif'],
        kantumruySemiBold: ['KantumruyProSemiBold', 'sans-serif'],
        kantumruyBold: ['KantumruyProBold', 'sans-serif'],
        kantumruyLight: ['KantumruyProLight', 'sans-serif'],
      },
    },
  },
  plugins: [],
};