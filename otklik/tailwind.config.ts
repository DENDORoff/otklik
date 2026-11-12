import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#082742",
          red: "#ED1111",
          // Заливка кнопок: чуть темнее фирменного красного, чтобы белый текст проходил WCAG AA.
          action: "#E10F0F",
          dark: "#C00000",
        },
        // Семантические токены: значения заданы в globals.css и меняются в тёмной теме.
        "brand-ink": "var(--color-brand-ink)",
        link: "var(--color-link)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        line: "var(--color-line)",
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        subtle: "var(--color-subtle)",
        info: "var(--color-info)",
      },
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
