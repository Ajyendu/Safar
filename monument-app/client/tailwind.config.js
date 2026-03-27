/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0c0f14",
          card: "#141a22",
          elevated: "#1a2230",
        },
        accent: {
          DEFAULT: "#3b82f6",
          muted: "#2563eb",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        float: "0 8px 30px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};
