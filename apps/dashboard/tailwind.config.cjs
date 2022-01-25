const config = {
	// mode: "jit",
	purge: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			// color matching IBM Carbon Colors
			// https://www.carbondesignsystem.com/guidelines/color/usage/
			colors: {
				danger: '#da1e28',
				'success-high-contrast': '#42be65',
				success: '#198038',
				warning: '#f1c21b',
				'warning-high-contrast': '#f1c21'
			}
		}
	},
	plugins: [],
	corePlugins: {
		preflight: false
	}
};

module.exports = config;
