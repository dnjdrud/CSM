import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/design/**/*.ts",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
        serif: ["Georgia", "Charter", "serif"],
      },
      lineHeight: {
        relaxed: "1.625",
        loose: "1.75",
      },
      colors: {
        /* Cellah: map to CSS variables */
        theme: {
          bg: "var(--bg)",
          surface: "var(--surface)",
          "surface-2": "var(--surface-2)",
          text: "var(--text)",
          muted: "var(--muted)",
          border: "var(--border)",
          primary: "var(--primary)",
          "primary-2": "var(--primary-2)",
          accent: "var(--accent)",
          danger: "var(--danger)",
        },
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      borderRadius: {
        card: "1rem",
        button: "0.5rem",
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgb(11 31 34 / 0.06), 0 1px 2px -1px rgb(11 31 34 / 0.06)",
      },
      fontSize: {
        body: ["15px", { lineHeight: "1.75rem" }],
        meta: ["12px", { lineHeight: "1rem" }],
        caption: ["11px", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
