const {
	colorSystem,
	components,
} = require("@inlang/design-system/tailwind-plugins");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {},
	},
	plugins: [colorSystem.configure(), components.configure()],
};
