const colors = require("./dist/colors/tailwindPlugin.cjs");
const typography = require("./dist/typography/tailwindPlugin.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/components/**/*.ts"],
	theme: {
		fontSize: {},
	},
	plugins: [colors.withConfig(), typography],
};
