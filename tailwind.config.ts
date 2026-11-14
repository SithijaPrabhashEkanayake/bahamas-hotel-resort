import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#F8FAF8",
          light: "#FFFFFF",
          dark: "#EEF3F0",
        },
        surface: {
          DEFAULT: "#F0F4F2",
          hover: "#E4ECE8",
          active: "#D5E2DC",
        },
        reef: {
          DEFAULT: "#006B7D",
          light: "#008B9E",
          dark: "#004B57",
          subtle: "#E0F2F5",
        },
        conch: {
          DEFAULT: "#E07A5F",
          hover: "#D06548",
          light: "#F7DBD3",
          dark: "#B84F35",
        },
        teak: {
          DEFAULT: "#C5A059",
          light: "#DBC188",
          dark: "#9E7B35",
          subtle: "#F9F4EA",
        },
        ocean: {
          DEFAULT: "#1A2E35",
          light: "#2C4852",
          dark: "#0F1C21",
        },
        driftwood: {
          DEFAULT: "#5C6B73",
          muted: "#7D8C94",
          light: "#A4B1B8",
        },
        border: "#DCE5E1",
        input: "#DCE5E1",
        ring: "#006B7D",
        background: "#F8FAF8",
        foreground: "#1A2E35",
        primary: {
          DEFAULT: "#006B7D",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#C5A059",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#E07A5F",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F0F4F2",
          foreground: "#5C6B73",
        },
        accent: {
          DEFAULT: "#E0F2F5",
          foreground: "#006B7D",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A2E35",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(26, 46, 53, 0.05), 0 1px 2px rgba(26, 46, 53, 0.03)",
        card: "0 4px 14px rgba(26, 46, 53, 0.06), 0 1px 3px rgba(26, 46, 53, 0.04)",
        elevated: "0 14px 34px rgba(26, 46, 53, 0.08), 0 4px 10px rgba(26, 46, 53, 0.05)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
