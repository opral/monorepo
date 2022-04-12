const colorSystem = require('@pankow-ui/color-system');
const typography = require('@pankow-ui/typography');
const colors = require('tailwindcss/colors');

module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts,md}'],
	theme: {},
	plugins: [
		typography,
		colorSystem.withConfig({
			// based on shoelace
			accentColors: { primary: colors.sky },
			neutralColors: {},
			semanticColors: {
				success: colors.green,
				warning: colors.amber,
				danger: colors.red
			}
		})
	]
};
