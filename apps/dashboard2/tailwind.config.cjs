const pankowUi = require('@pankow/typography');
const x = require('@pankow/typography');

module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts,md}'],
	theme: {
		extend: {}
	},
	plugins: [
		require('@pankow/typography')
		// pankowUi.withConfig({ colorSystem: { semanticColors: { info: colors.blue } } })
	]
};
