module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
	plugins: ['svelte3', '@typescript-eslint', 'unicorn'],
	ignorePatterns: ['*.cjs', '.svelte-kit/**', '.vercel/**', '.vercel_build_output/**'],
	overrides: [{ files: ['*.svelte'], processor: 'svelte3/svelte3' }],
	settings: {
		'svelte3/typescript': () => require('typescript')
	},
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2019
	},
	rules: {
		'unicorn/no-array-for-each': 'error',
		'unicorn/prefer-spread': 'warn',
		'unicorn/prefer-array-find': 'error',
		'unicorn/prefer-array-flat': 'error',
		'unicorn/prefer-array-flat-map': 'error',
		'unicorn/prefer-array-index-of': 'error',
		'unicorn/prefer-array-some': 'error'
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	}
};
