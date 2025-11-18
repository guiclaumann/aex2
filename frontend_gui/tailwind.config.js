// tailwind.config.js
module.exports = {
  content: [
    "./client/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "oklch(0.92 0.004 286.32)",
        background: "oklch(1 0 0)", 
        foreground: "oklch(0.13 0.028 261.692)",
        ring: "oklch(0.623 0.214 259.815)",
        primary: {
          DEFAULT: "oklch(0.21 0.034 260.788)",
          foreground: "oklch(0.985 0 0)",
        },
        secondary: {
          DEFAULT: "oklch(0.967 0.001 286.375)", 
          foreground: "oklch(0.21 0.034 260.788)",
        },
        muted: {
          DEFAULT: "oklch(0.967 0.001 286.375)",
          foreground: "oklch(0.552 0.016 285.938)",
        },
        accent: {
          DEFAULT: "oklch(0.967 0.001 286.375)",
          foreground: "oklch(0.21 0.034 260.788)",
        },
        destructive: {
          DEFAULT: "oklch(0.577 0.245 27.325)",
          foreground: "oklch(0.985 0 0)",
        },
        card: {
          DEFAULT: "oklch(1 0 0)",
          foreground: "oklch(0.13 0.028 261.692)",
        },
        popover: {
          DEFAULT: "oklch(1 0 0)",
          foreground: "oklch(0.13 0.028 261.692)",
        },
      },
      borderRadius: {
        lg: "0.625rem",
      },
    },
  },
  plugins: [],
}