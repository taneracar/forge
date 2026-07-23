/** @type {import('tailwindcss').Config} */
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
        surface: {
          DEFAULT: "#1D1913",
          raised: "#241F17",
        },
        border: "rgba(247, 243, 236, 0.08)",
      },
      fontFamily: {
        display: ["Anton_400Regular"],
        body: ["PlusJakartaSans_400Regular"],
        "body-medium": ["PlusJakartaSans_500Medium"],
        "body-semibold": ["PlusJakartaSans_600SemiBold"],
        "body-bold": ["PlusJakartaSans_700Bold"],
        mono: ["JetBrainsMono_400Regular"],
      },
    },
  },
  plugins: [],
};
