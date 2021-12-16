module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	extends: ['@inlang/eslint-config'],
	plugins: ['svelte3'],
	ignorePatterns: ['*.cjs', '.svelte-kit/**', '.vercel/**', '.vercel_build_output/**'],
	overrides: [{ files: ['*.svelte'], processor: 'svelte3/svelte3' }],
	settings: {
		'svelte3/typescript': () => require('typescript')
	},
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2019
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	}
};
