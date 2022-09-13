const colors = require("./dist/colors/tailwindPlugin.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/components/**/*.ts"],
	theme: {},
	plugins: [colors.withConfig({})],
};
