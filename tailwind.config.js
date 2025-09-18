/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slack: {
          purple: '#4A154B',
          dark: '#1a1d21',
          sidebar: '#19171d',
          hover: '#350d36',
          active: '#1164A3',
          green: '#007a5a',
          text: '#d1d2d3',
          border: '#35373b',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

