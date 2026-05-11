import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
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
          text: '#8FA99A',
          border: '#D4E4DA',
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        train: {
          steel: "hsl(var(--train-steel))",
          track: "hsl(var(--train-track))",
          signal: "hsl(var(--train-signal))",
          warning: "hsl(var(--train-warning))",
        },
        forest: {
          950: '#0D1F12',
          900: '#163020',
          800: '#1E4D2B',
          700: '#2D7A45',
          600: '#3DAA62',
          500: '#52C97A',
        },
        amber: {
          brand: '#F5A623',
          soft:  '#FFC94D',
          pale:  '#FFF3D4',
        },
        surface: {
          DEFAULT: '#F2F7F4',
          card: '#FFFFFF',
        },
        coral: '#E8503A',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'glow-green': '0 0 24px rgba(61,170,98,0.20)',
        'glow-amber': '0 0 24px rgba(245,166,35,0.30)',
        'card':       '0 2px 16px rgba(13,31,18,0.08)',
        'card-hover': '0 8px 32px rgba(13,31,18,0.14)',
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        slideIn: { from: { transform: 'translateX(-100%)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        fadeIn:  { from: { opacity: '0', transform: 'translateY(6px)' },   to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'slide-in':     'slideIn 0.2s ease-out',
        'fade-in':      'fadeIn 0.25s ease-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
