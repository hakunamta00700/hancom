import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "ui-serif", "Georgia"],
      },
      colors: {
        ink: "#0b0f13",
        mist: "#f3f1e9",
        coral: "#f05d23",
        teal: "#0f766e",
        sun: "#f4a261",
        slate: "#2d3748",
      },
      boxShadow: {
        card: "0 12px 40px rgba(10, 20, 30, 0.18)",
        soft: "0 8px 24px rgba(10, 20, 30, 0.12)",
      },
      backgroundImage: {
        "grain": "radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.06) 1px, transparent 0)",
        "hero": "linear-gradient(135deg, #f3f1e9 0%, #fff6e6 45%, #e5f7f4 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
