/** @type {import('tailwindcss').Config} */
import { slate } from "tailwindcss/colors";

export default {
	darkMode: ["class", "class"],
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				neutral: "slate",
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
				chart: {
					1: "hsl(var(--chart-1))",
					2: "hsl(var(--chart-2))",
					3: "hsl(var(--chart-3))",
					4: "hsl(var(--chart-4))",
					5: "hsl(var(--chart-5))",
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
				brand: {
					DEFAULT: "hsl(var(--brand))",
					foreground: "hsl(var(--brand-foreground))",
				},
				highlight: {
					DEFAULT: "hsl(var(--highlight))",
					foreground: "hsl(var(--highlight-foreground))",
				},
			},
			borderRadius: {
				sm: "calc(var(--radius) - 4px)",
				md: "calc(var(--radius) - 2px)",
				lg: "var(--radius)",
			},
			fontFamily: {
				poppins: "var(--font-poppins)",
				inter: "var(--font-inter)",
				heading: [
					"var(--font-heading)",
					"ui-sans-serif",
					"-apple-system",
					"BlinkMacSystemFont",
					"Segoe UI Variable Display",
					"Segoe UI",
					"Helvetica",
					"Apple Color Emoji",
					"Arial",
					"sans-serif",
					"Segoe UI Emoji",
					"Segoe UI Symbol",
					"Noto Color Emoji",
				],
				mono: [
					"var(--font-mono)",
					...require("tailwindcss/defaultTheme").fontFamily.mono,
				],
				sans: [
					"var(--font-sans)",
					"ui-sans-serif",
					"-apple-system",
					"BlinkMacSystemFont",
					"Segoe UI Variable Display",
					"Segoe UI",
					"Helvetica",
					"Apple Color Emoji",
					"Arial",
					"sans-serif",
					"Segoe UI Emoji",
					"Segoe UI Symbol",
					"Noto Color Emoji",
				],
			},
			keyframes: {
				"accordion-down": {
					from: {
						height: "0",
					},
					to: {
						height: "var(--radix-accordion-content-height)",
					},
				},
				"accordion-up": {
					from: {
						height: "var(--radix-accordion-content-height)",
					},
					to: {
						height: "0",
					},
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
			screens: {
				"main-hover": {
					raw: "(hover: hover)",
				},
			},
		},
	},
	plugins: [import("tailwindcss-animate"), import("tailwind-scrollbar-hide")],
};
