import type { Config } from "tailwindcss";

/**
 * PLACEHOLDER THEME — overwritten by the demo-builder Design phase from
 * specs/design-tokens.json. The SEMANTIC NAMES below are the reusable contract
 * (bg-primary, text-heading, font-heading, max-w-page, shadow-md, etc.): the
 * plumbing components (ConsentManager, DemoFooter, SignalsInspector, …) style
 * against these names, so keep the keys and only swap the VALUES per demo.
 *
 * Tailwind v4 note: values can also be expressed as @theme CSS variables in
 * globals.css. This config is bridged in via `@config "../../tailwind.config.ts"`.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        secondary: "#6366F1",
        accent: "#3B82F6",
        highlight: "#60A5FA",
        background: "#0B1220",
        surface: "#111A2B",
        "surface-raised": "#18233A",
        border: "#2A3650",
        light: {
          bg: "#FFFFFF",
          surface: "#F5F7FA",
          border: "#E3E8EC",
        },
        heading: "#FFFFFF",
        body: "#AEB9C4",
        muted: "#6B7885",
        inverse: "#0B1220",
        link: "#93C5FD",
        success: "#37B24D",
        warning: "#F59E0B",
        error: "#E03131",
        info: "#3B82F6",
      },
      fontFamily: {
        heading: ["var(--font-sans)", "Arial", "sans-serif"],
        body: ["var(--font-sans)", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        h1: ["2.75rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        h2: ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        h3: ["1.5rem", { lineHeight: "1.2" }],
        h4: ["1.125rem", { lineHeight: "1.3" }],
        h5: ["1rem", { lineHeight: "1.4" }],
        body: ["1rem", { lineHeight: "1.5" }],
        small: ["0.875rem", { lineHeight: "1.45" }],
        nav: ["0.875rem", { lineHeight: "1.2" }],
      },
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2.5rem",
        "2xl": "4rem",
        section: "5rem",
      },
      maxWidth: {
        // GOTCHA (carried from real builds): the custom `spacing` keys above
        // (sm/md/lg/xl/2xl) outrank theme.maxWidth for `max-w-*` under the
        // @config bridge, collapsing `max-w-md`/`xl`/`2xl` to tiny values. Use
        // an arbitrary value (`max-w-[28rem]`) for small/medium widths; `page`
        // is collision-free.
        page: "1280px",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.75rem",
        lg: "1rem",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0, 0, 0, 0.35)",
        md: "0 6px 20px rgba(0, 0, 0, 0.45)",
        lg: "0 16px 48px rgba(0, 0, 0, 0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
