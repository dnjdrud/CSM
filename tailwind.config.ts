import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./common/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/design/**/*.ts",
  ],
  theme: {
    extend: {
      /* ── Fonts ── */
      fontFamily: {
        sans: ['"Pretendard Variable"', "Pretendard", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Georgia", "Charter", '"Noto Serif KR"', "serif"],
        mono: ['"JetBrains Mono"', "Menlo", "monospace"],
      },

      /* ── Line heights ── */
      lineHeight: {
        tight:   "1.25",
        snug:    "1.375",
        normal:  "1.5",
        relaxed: "1.625",
        loose:   "1.75",
        reading: "1.8",
      },

      /* ── Letter spacing ── */
      letterSpacing: {
        tighter: "-0.03em",
        tight:   "-0.025em",
        normal:  "0",
        wide:    "0.025em",
        wider:   "0.05em",
        caps:    "0.08em",
      },

      /* ── Colors (CSS variables) ── */
      colors: {
        theme: {
          bg:          "var(--bg)",
          surface:     "var(--surface)",
          "surface-2": "var(--surface-2)",
          "surface-3": "var(--surface-3)",
          text:        "var(--text)",
          "text-2":    "var(--text-2)",
          muted:       "var(--muted)",
          border:      "var(--border)",
          "border-2":  "var(--border-2)",
          primary:     "var(--primary)",
          "primary-2": "var(--primary-2)",
          accent:      "var(--accent)",
          "accent-bg": "var(--accent-bg)",
          danger:      "var(--danger)",
          "danger-bg": "var(--danger-bg)",
          success:     "var(--success)",
          "success-bg":"var(--success-bg)",
          warning:     "var(--warning)",
          "warning-bg":"var(--warning-bg)",
        },
      },

      borderColor: {
        DEFAULT: "var(--border)",
      },

      /* ── Border radius ── */
      borderRadius: {
        sm:   "6px",
        md:   "10px",
        lg:   "14px",
        xl:   "18px",
        "2xl":"24px",
        card: "18px",   // semantic alias
        panel:"14px",
        button:"10px",
        input: "10px",
        pill:  "9999px",
      },

      /* ── Shadows ── */
      boxShadow: {
        xs:   "0 1px 2px rgb(0 0 0 / 0.04)",
        sm:   "0 1px 3px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04)",
        soft: "0 2px 8px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.04)",
        md:   "0 4px 12px rgb(0 0 0 / 0.07), 0 2px 4px rgb(0 0 0 / 0.04)",
        lg:   "0 10px 24px rgb(0 0 0 / 0.07), 0 4px 8px rgb(0 0 0 / 0.04)",
        xl:   "0 20px 40px rgb(0 0 0 / 0.08), 0 8px 16px rgb(0 0 0 / 0.04)",
        inner:"inset 0 2px 4px rgb(0 0 0 / 0.05)",
        card: "0 1px 3px rgb(0 0 0 / 0.05), 0 1px 2px rgb(0 0 0 / 0.03)",
        "card-hover": "0 4px 12px rgb(0 0 0 / 0.08), 0 2px 4px rgb(0 0 0 / 0.04)",
      },

      /* ── Font sizes ── */
      fontSize: {
        caption: ["11px", { lineHeight: "1.4",  letterSpacing: "0.01em" }],
        meta:    ["12px", { lineHeight: "1.5",  letterSpacing: "0" }],
        sm:      ["13px", { lineHeight: "1.6",  letterSpacing: "0" }],
        body:    ["15px", { lineHeight: "1.75", letterSpacing: "0" }],
        "body-md":["16px",{ lineHeight: "1.625",letterSpacing: "-0.01em" }],
        lg:      ["18px", { lineHeight: "1.5",  letterSpacing: "-0.015em" }],
        xl:      ["22px", { lineHeight: "1.3",  letterSpacing: "-0.02em" }],
        "2xl":   ["28px", { lineHeight: "1.2",  letterSpacing: "-0.025em" }],
        "3xl":   ["34px", { lineHeight: "1.15", letterSpacing: "-0.03em" }],
      },

      /* ── Spacing additions ── */
      spacing: {
        "4.5": "1.125rem",
        "5.5": "1.375rem",
        "13":  "3.25rem",
        "15":  "3.75rem",
        "18":  "4.5rem",
      },

      /* ── Transitions ── */
      transitionDuration: {
        fast:   "120ms",
        normal: "200ms",
        slow:   "320ms",
      },

      /* ── Animation ── */
      keyframes: {
        "reaction-pop": {
          "0%":   { transform: "scale(1)" },
          "45%":  { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)" },
        },
        "fade-in": {
          "from": { opacity: "0", transform: "translateY(4px)" },
          "to":   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "reaction-pop": "reaction-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "fade-in":      "fade-in 200ms ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
