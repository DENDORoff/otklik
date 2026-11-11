import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#082742",
          red: "#ED1111",
          dark: "#C00000",
        },
        link: "#E40000",
        ink: "#323A47",
        muted: "#64748D",
        line: "#D1D5DD",
        canvas: "#F4F4F4",
        info: "#EFF6FD",
      },
      fontFamily: {
        sans: ["Gilroy", "Montserrat", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
