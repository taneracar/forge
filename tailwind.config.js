/** @type {import('tailwindcss').Config} */
// Keep in sync with src/constants/colors.ts (raw values for icon/SVG props).
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#14110D",
        foreground: "#F7F3EC",
        primary: {
          DEFAULT: "#FF5A1F",
          foreground: "#14110D",
          glow: "#FFB627",
        },
        accent: {
          DEFAULT: "#B23A11",
          foreground: "#F7F3EC",
        },
        muted: {
          DEFAULT: "#6B655C",
          foreground: "#B7B0A4",
        },
        // Layered surfaces: each step is visibly lighter than the last so
        // cards actually separate from the background.
        surface: {
          sunken: "#100D0A",
          DEFAULT: "#1C1815",
          raised: "#2A241E",
          overlay: "#332B23",
        },
        // Semantic colors — previously everything important was primary
        // orange, leaving no hierarchy between "done", "record" and "error".
        success: {
          DEFAULT: "#3DD68C",
          foreground: "#0B1F14",
        },
        danger: {
          DEFAULT: "#F2555A",
          foreground: "#F7F3EC",
        },
        warning: {
          DEFAULT: "#FFB627",
          foreground: "#14110D",
        },
        // Categorical data-viz series, assigned in this fixed order. Checked
        // for colorblind separation against the dark surface (worst adjacent
        // pair ΔE 23.6 deuteranopia), which is why the third slot is a deep
        // gold rather than the violet a blue→purple ramp would suggest.
        chart: {
          DEFAULT: "#FF5A1F",
          alt: "#4EA8DE",
          tertiary: "#B68B16",
        },
        border: {
          DEFAULT: "rgba(247, 243, 236, 0.08)",
          strong: "rgba(247, 243, 236, 0.16)",
        },
      },
      fontFamily: {
        display: ["Anton_400Regular"],
        body: ["PlusJakartaSans_400Regular"],
        "body-medium": ["PlusJakartaSans_500Medium"],
        "body-semibold": ["PlusJakartaSans_600SemiBold"],
        "body-bold": ["PlusJakartaSans_700Bold"],
        // Reserved for numeric metrics (weight, reps, duration, volume).
        mono: ["JetBrainsMono_400Regular"],
      },
      borderRadius: {
        card: "18px",
        tile: "14px",
      },
    },
  },
  plugins: [],
};
