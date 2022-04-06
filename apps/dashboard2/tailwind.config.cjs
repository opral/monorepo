const pankowUi = require('@pankow-ui/pankow-ui');
const colors = require('tailwindcss/colors');

module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts,md}'],
	theme: {
		extend: {}
	},
	plugins: [
		pankowUi.withConfig({
			// based on shoelace
			colorSystem: {
				accentColors: { primary: colors.sky },
				neutralColors: {},
				semanticColors: {
					success: colors.green,
					warning: colors.amber,
					danger: colors.red
				}
			},
			borderRadiusBase: 'rounded'
		})
	]
};
