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
            // ── shadcn/ui CSS 변수 기반 토큰 ──
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
                // ── Zinsight 디자인 시스템 색상 토큰 ──
                "zi-navy": "#001F3F",
                "zi-blue": "#005eb2",
                "zi-blue-bright": "#4597fe",
                "zi-surface": "#fcf9f8",
                "zi-surface-low": "#f6f3f2",
                "zi-surface-container": "#f0eded",
                "zi-surface-high": "#eae7e7",
                "zi-surface-highest": "#e5e2e1",
                "zi-on-surface": "#1c1b1b",
                "zi-on-surface-variant": "#43474e",
                "zi-outline": "#74777f",
                "zi-outline-variant": "#c4c6cf",
                "zi-divider": "#E1E4E8",
                "zi-error": "#ba1a1a",
            },
            // ── Zinsight 폰트 패밀리 ──
            fontFamily: {
                serif: ["Newsreader", "Georgia", "serif"],
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            // ── Zinsight 폰트 크기 스케일 ──
            fontSize: {
                "zi-display": ["48px", { lineHeight: "1.2", fontWeight: "600" }],
                "zi-headline-lg": ["32px", { lineHeight: "1.3", fontWeight: "600" }],
                "zi-headline-md": ["24px", { lineHeight: "1.4", fontWeight: "700" }],
                "zi-body-lg": ["18px", { lineHeight: "1.7", fontWeight: "400" }],
                "zi-body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
                "zi-label": ["13px", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" }],
                "zi-caption": ["12px", { lineHeight: "1.4", fontWeight: "400" }],
            },
            // ── 간격 토큰 ──
            spacing: {
                "zi-gutter": "24px",
                "zi-edge": "40px",
                "zi-stack-sm": "8px",
                "zi-stack-md": "16px",
                "zi-stack-lg": "32px",
            },
            // ── 최대 너비 ──
            maxWidth: {
                "zi-container": "1280px",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
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
