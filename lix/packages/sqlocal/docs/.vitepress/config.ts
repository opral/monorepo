import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'SQLocal',
	description:
		'SQLocal makes it easy to run SQLite3 in the browser, backed by the origin private file system.',
	cleanUrls: true,
	head: [
		[
			'script',
			{
				defer: '',
				src: 'https://static.cloudflareinsights.com/beacon.min.js',
				'data-cf-beacon': '{"token": "a704e6c1c1ce48d785c23648f446abc6"}',
			},
		],
	],
	themeConfig: {
		search: { provider: 'local' },
		nav: [
			{ text: 'Introduction', link: '/guide/introduction' },
			{ text: 'Setup', link: '/guide/setup' },
		],
		sidebar: [
			{
				text: 'Getting Started',
				items: [
					{ text: 'Introduction', link: '/guide/introduction' },
					{ text: 'Setup', link: '/guide/setup' },
				],
			},
			{
				text: 'Methods',
				items: [
					{
						text: 'sql',
						link: '/api/sql',
					},
					{
						text: 'batch',
						link: '/api/batch',
					},
					{
						text: 'transaction',
						link: '/api/transaction',
					},
					{
						text: 'getDatabaseInfo',
						link: '/api/getdatabaseinfo',
					},
					{
						text: 'getDatabaseFile',
						link: '/api/getdatabasefile',
					},
					{
						text: 'overwriteDatabaseFile',
						link: '/api/overwritedatabasefile',
					},
					{
						text: 'createCallbackFunction',
						link: '/api/createcallbackfunction',
					},
					{
						text: 'createScalarFunction',
						link: '/api/createscalarfunction',
					},
					{
						text: 'destroy',
						link: '/api/destroy',
					},
				],
			},
			{
				text: 'Kysely Query Builder',
				items: [
					{ text: 'Kysely Setup', link: '/kysely/setup' },
					{ text: 'Kysely Migrations', link: '/kysely/migrations' },
				],
			},
			{
				text: 'Drizzle ORM',
				items: [{ text: 'Drizzle Setup', link: '/drizzle/setup' }],
			},
		],
		socialLinks: [
			{
				icon: 'github',
				link: 'https://github.com/DallasHoff/sqlocal',
				ariaLabel: 'GitHub',
			},
			{
				icon: {
					svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="M0 0v16h16V0H0zm13 13h-2V5H8v8H3V3h10v10z"/></svg>',
				},
				link: 'https://www.npmjs.com/package/sqlocal',
				ariaLabel: 'NPM',
			},
			{
				icon: {
					svg: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15"><path fill="currentColor" d="M13.91 7.75c-1.17 2.25-4.3 5.31-6.07 6.94a.5.5 0 0 1-.67 0C5.39 13.06 2.26 10 1.09 7.75C-1.48 2.8 5-.5 7.5 4.45C10-.5 16.48 2.8 13.91 7.75"/></svg>',
				},
				link: 'https://www.paypal.com/biz/fund?id=U3ZNM2Q26WJY8',
				ariaLabel: 'Fund',
			},
		],
		footer: {
			message: 'Released under the MIT License',
			copyright: 'Copyright © 2023-present Dallas Hoffman',
		},
	},
});
