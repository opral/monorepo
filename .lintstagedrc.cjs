// @ts-check

/** @type { Record<string, string[]> } */
const config = {
	'*.{json,md,dockerfile}': [
		'npm run format:fix:base',
	],
	'!(apps/dashboard/**)/**/*.{js,cjs,mjs,ts,mts,d.ts}': [
		'npm run format:fix:base',
		'npm run lint:fix:base',
	],
}

module.exports = config
