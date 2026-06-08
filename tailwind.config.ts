import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--sys-color-primary)",
          container: "var(--sys-color-primary-container)",
          on: "var(--sys-color-on-primary)",
          "on-container": "var(--sys-color-on-primary-container)",
        },
        secondary: {
          DEFAULT: "var(--sys-color-secondary)",
          container: "var(--sys-color-secondary-container)",
          on: "var(--sys-color-on-secondary)",
          "on-container": "var(--sys-color-on-secondary-container)",
        },
        tertiary: {
          DEFAULT: "var(--sys-color-tertiary)",
          container: "var(--sys-color-tertiary-container)",
          on: "var(--sys-color-on-tertiary)",
          "on-container": "var(--sys-color-on-tertiary-container)",
        },
        accent: {
          DEFAULT: "var(--sys-color-accent)",
          container: "var(--sys-color-accent-container)",
          on: "var(--sys-color-on-accent)",
          "on-container": "var(--sys-color-on-accent-container)",
        },
        success: {
          DEFAULT: "var(--sys-color-success)",
          container: "var(--sys-color-success-container)",
          on: "var(--sys-color-on-success)",
        },
        error: {
          DEFAULT: "var(--sys-color-error)",
          container: "var(--sys-color-error-container)",
          on: "var(--sys-color-on-error)",
        },
        background: "var(--sys-color-background)",
        surface: {
          DEFAULT: "var(--sys-color-surface)",
          variant: "var(--sys-color-surface-variant)",
          dim: "var(--sys-color-surface-dim)",
          bright: "var(--sys-color-surface-bright)",
        },
        outline: {
          DEFAULT: "var(--sys-color-outline)",
          variant: "var(--sys-color-outline-variant)",
        },
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
      },
      borderRadius: {
        xs: "var(--sys-radius-radius-xs)",
        sm: "var(--sys-radius-radius-sm)",
        md: "var(--sys-radius-radius-md)",
        lg: "var(--sys-radius-radius-lg)",
        xl: "var(--sys-radius-radius-xl)",
        full: "var(--sys-radius-radius-full)",
      },
      spacing: {
        "0": "var(--sys-spacing-space-0)",
        "1": "var(--sys-spacing-space-1)",
        "2": "var(--sys-spacing-space-2)",
        "3": "var(--sys-spacing-space-3)",
        "4": "var(--sys-spacing-space-4)",
        "5": "var(--sys-spacing-space-5)",
        "6": "var(--sys-spacing-space-6)",
        "7": "var(--sys-spacing-space-7)",
        "8": "var(--sys-spacing-space-8)",
        "9": "var(--sys-spacing-space-9)",
        "10": "var(--sys-spacing-space-10)",
        "11": "var(--sys-spacing-space-11)",
      },
      boxShadow: {
        1: "var(--sys-effect-shadow-1)",
        2: "var(--sys-effect-shadow-2)",
        3: "var(--sys-effect-shadow-3)",
      },
    },
  },
  plugins: [],
};
export default config;
