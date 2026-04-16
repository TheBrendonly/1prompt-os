
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '3rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar))',
					foreground: 'hsl(var(--sidebar-foreground))',
				},
				surface: 'hsl(var(--surface))',
				'surface-variant': 'hsl(var(--surface-variant))',
				'on-surface': 'hsl(var(--on-surface))',
				'on-surface-variant': 'hsl(var(--on-surface-variant))',
				outline: 'hsl(var(--outline))',
				'accent-soft': '#F0EDE8',
				'mono-green': { DEFAULT: '#2D6A4F', bg: '#F0FAF5', border: '#A8D5BE' },
				'mono-amber': { DEFAULT: '#A05C00', bg: '#FFF8EC', border: '#F5D08A' },
				'mono-red': { DEFAULT: '#8B1A1A', bg: '#FDF0F0', border: '#F0B0B0' },
				'mono-blue': { DEFAULT: '#1A3A6B', bg: '#EEF4FF', border: '#A8C0F0' },
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'var(--radius)',
				sm: 'var(--radius)',
				xl: 'var(--radius)',
				'2xl': 'var(--radius)',
			},
		fontFamily: {
				sans: ["'IBM Plex Mono'", 'monospace'],
				mono: ["'IBM Plex Mono'", 'monospace'],
				heading: ["'VT323'", 'monospace'],
				display: ["'VT323'", 'monospace'],
				body: ["'IBM Plex Mono'", 'monospace'],
			},
		fontSize: {
		'xs':   ['12px', { lineHeight: '1.6' }],
			'sm':   ['13px', { lineHeight: '1.6' }],
			'base': ['14px', { lineHeight: '1.6' }],
			'md':   ['15px', { lineHeight: '1.5' }],
			'lg':   ['18px', { lineHeight: '1.4' }],
			'xl':   ['22px', { lineHeight: '1.2' }],
			'2xl':  ['30px', { lineHeight: '1.0' }],
			'3xl':  ['38px', { lineHeight: '1.0' }],
		},
			letterSpacing: {
				tightest: '-0.03em',
				tight:    '-0.01em',
				normal:    '0em',
				wide:      '0.06em',
				wider:     '0.10em',
				widest:    '0.14em',
			},
			boxShadow: {
				none: 'none',
				sm:   'none',
				md:   'none',
				lg:   'none',
				xl:   'none',
				'2xl':'none',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.95)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'slide-up': {
					from: { opacity: '0', transform: 'translateY(20px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--primary) / 0.7)' },
					'50%': { boxShadow: '0 0 0 10px hsl(var(--primary) / 0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
