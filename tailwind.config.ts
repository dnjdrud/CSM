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
      // Semantic: use gray-200 for borders unless subtle (gray-100)
      borderColor: {
        DEFAULT: "rgb(229 231 235)", // gray-200
      },
      // Design tokens (semantic naming; map to existing scale)
      colors: {
        design: {
          surface: "#ffffff",
          surfaceMuted: "rgb(249 250 251)", // gray-50
          border: "rgb(229 231 235)", // gray-200
          borderSubtle: "rgb(243 244 246)", // gray-100
          text: "rgb(31 41 55)", // gray-800
          textMuted: "rgb(107 114 128)", // gray-500
        },
      },
      borderRadius: {
        card: "0.75rem", // rounded-xl
        button: "0.5rem", // rounded-lg
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
