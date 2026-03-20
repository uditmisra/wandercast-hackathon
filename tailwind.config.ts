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
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				display: ['DM Serif Display', 'Georgia', 'Times New Roman', 'serif'],
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
			},
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
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					pink: 'var(--accent-pink)',
					orange: 'var(--accent-orange)',
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
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				arch: '120px 120px 0 0',
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
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '200% 0' },
					'100%': { backgroundPosition: '-200% 0' }
				},
				'slide-up': {
					'0%': { opacity: '0', transform: 'translateY(12px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'orb-float': {
					'0%, 100%': { transform: 'translate(0, 0) scale(1)' },
					'50%': { transform: 'translate(10px, 20px) scale(1.1)' }
				},
				'pulse-marker': {
					'0%': { transform: 'scale(0.8)', opacity: '0.6' },
					'100%': { transform: 'scale(2)', opacity: '0' }
				},
				'waveform-bounce': {
					'0%, 100%': { transform: 'scaleY(0.3)' },
					'50%': { transform: 'scaleY(1)' }
				},
				'onboarding-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'onboarding-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' }
				},
				'slide-down-in': {
					'0%': { opacity: '0', transform: 'translateY(-20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-up-out': {
					'0%': { opacity: '1', transform: 'translateY(0)' },
					'100%': { opacity: '0.5', transform: 'translateY(-8px)' }
				},
				'pulse-ring': {
					'0%': { transform: 'scale(1)', opacity: '0.6' },
					'100%': { transform: 'scale(2)', opacity: '0' }
				},
				'pulse-dot': {
					'0%, 80%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
					'40%': { opacity: '1', transform: 'scale(1.2)' }
				},
				'audio-wave': {
					'0%, 100%': { height: '4px' },
					'50%': { height: '16px' }
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'shimmer': 'shimmer 1.5s ease-in-out infinite',
				'slide-up': 'slide-up 0.4s ease-out',
				'orb-float': 'orb-float 8s ease-in-out infinite alternate',
				'pulse-marker': 'pulse-marker 2s ease-out infinite',
				'waveform-bounce': 'waveform-bounce 1s ease-in-out infinite',
				'onboarding-in': 'onboarding-in 0.4s ease-out forwards',
				'onboarding-out': 'onboarding-out 0.3s ease-in forwards',
				'slide-down-in': 'slide-down-in 0.4s ease-out',
				'fade-up-out': 'fade-up-out 0.3s ease-out forwards',
				'pulse-ring': 'pulse-ring 2s ease-out infinite',
				'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
				'audio-wave': 'audio-wave 1.2s ease-in-out infinite',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
