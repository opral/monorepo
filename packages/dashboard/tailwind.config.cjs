const config = {
	// mode: "jit",
	purge: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			// color matching IBM Carbon Colors
			colors: {
				danger: '#da1e28'
			}
		}
	},
	plugins: []
};

module.exports = config;
