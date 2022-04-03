const pankowUi = require('@pankow/pankow-ui');
const colors = require('tailwindcss/colors');

module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts,md}'],
	theme: {
		extend: {}
	},
	plugins: [pankowUi.withConfig({ colorSystem: { semanticColors: { info: colors.blue } } })]
};
