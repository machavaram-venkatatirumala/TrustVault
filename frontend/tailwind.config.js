/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "var(--background)",
          warm: "var(--background-warm)",
        },
        surface: {
          subtle: "var(--surface-subtle)",
          blue: "var(--surface-blue)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          soft: "var(--primary-soft)",
        },
        accent: {
          blue: "var(--accent-blue)",
          periwinkle: "var(--accent-periwinkle)",
          ink: "var(--accent-ink)",
          champagne: "var(--accent-champagne)",
        },
        success: {
          DEFAULT: "var(--success)",
          bg: "#E8F6F0",
        },
        warning: {
          DEFAULT: "var(--warning)",
          bg: "#FFF5E3",
        },
        danger: {
          DEFAULT: "var(--danger)",
          bg: "#FCECEF",
        },
        info: {
          DEFAULT: "var(--info)",
          bg: "#EAF2FF",
        },
      },
      borderRadius: {
        small: "var(--radius-small)",
        medium: "var(--radius-medium)",
        large: "var(--radius-large)",
      },
      fontFamily: {
        sans: ["Inter", "Geist", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(16, 24, 40, 0.04)",
        card: "0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.04)",
        dropdown: "0 4px 16px -2px rgba(16, 24, 40, 0.08), 0 2px 6px -2px rgba(16, 24, 40, 0.03)",
        modal: "0 20px 24px -4px rgba(16, 24, 40, 0.08), 0 8px 8px -4px rgba(16, 24, 40, 0.03)",
      },
    },
  },
  plugins: [],
};
