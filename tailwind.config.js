/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        syne: "Syne",
        imperial: "Imperial Script"
      },
    },
  },
  plugins: [],
};
