const typography = require("@inlang/design-system/typography/tailwind-plugin");
const colors = require("@inlang/design-system/colors/tailwind-plugin");
const components = require("@inlang/design-system/components/tailwind-plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {},
	},
	plugins: [typography.configure(), colors.configure(), components.configure()],
	safelist: [...components.usedUtilityClasses()],
};
