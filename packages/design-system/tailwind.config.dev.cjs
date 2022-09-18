const { colors, typography, components } = require("./dist/index.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/components/**/*.ts"],
	theme: {},
	plugins: [
		colors.configure(colors.defaultConfig),
		typography.configure(),
		components.configure(),
	],
	// we safelist all tailwind classes to enable
	// dynamic style changing in storybook
	safelist: [{ pattern: /./ }],
};
