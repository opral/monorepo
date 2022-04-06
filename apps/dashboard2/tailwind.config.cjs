const pankowUi = require('@pankow-ui/pankow-ui');
const colors = require('tailwindcss/colors');

module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts,md}'],
	theme: {
		extend: {}
	},
	plugins: [
		pankowUi.withConfig({
			colorSystem: { semanticColors: { info: colors.blue, success: colors.green } },
			borderRadiusBase: 'rounded'
		})
	]
};
