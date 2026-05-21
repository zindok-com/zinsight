import type { Config } from "tailwindcss";

const config = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: "",
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
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // ── Zinsight Intellect Editorial Color Tokens ──
                "zi-surface": "#faf9fe",
                "zi-on-surface": "#1a1c1f",
                "zi-on-surface-variant": "#43474f",
                "zi-primary": "#001736",
                "zi-secondary": "#006b5f",
                "zi-tertiary": "#2f0c00",
                "zi-outline": "#747780",
                "zi-outline-variant": "#c4c6d0",
                "zi-surface-container": "#eeedf2",
                "zi-surface-container-low": "#f4f3f8",
                "zi-surface-container-highest": "#e3e2e7",
                "zi-blue": "hsl(var(--zi-blue))",
            },
            fontFamily: {
                sans: ["var(--font-pretendard)", "var(--font-sans)", "sans-serif"],
                serif: ["var(--font-serif)", "serif"],
                h1: ["var(--font-serif)", "serif"],
                h2: ["var(--font-serif)", "serif"],
                h3: ["var(--font-serif)", "serif"],
                "body-lg": ["var(--font-pretendard)", "sans-serif"],
                "body-md": ["var(--font-pretendard)", "sans-serif"],
                "ui-label": ["var(--font-pretendard)", "sans-serif"],
                "data-num": ["var(--font-pretendard)", "sans-serif"],
            },
            fontSize: {
                "h1": ["40px", { lineHeight: "1.4", letterSpacing: "-0.02em", fontWeight: "700" }],
                "h2": ["32px", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "700" }],
                "h3": ["24px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "600" }],
                "body-lg": ["18px", { lineHeight: "1.8", letterSpacing: "-0.01em", fontWeight: "400" }],
                "body-md": ["16px", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }],
                "ui-label": ["14px", { lineHeight: "1.2", letterSpacing: "0.02em", fontWeight: "500" }],
                "data-num": ["14px", { lineHeight: "1", letterSpacing: "0", fontWeight: "600" }],
            },
            spacing: {
                "base": "8px",
                "xs": "4px",
                "sm": "12px",
                "md": "24px",
                "lg": "48px",
                "xl": "80px",
                "grid-gutter": "24px",
            },
            maxWidth: {
                "zi-container": "1280px",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                "zi-card": "12px",
                "zi-btn": "6px",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
