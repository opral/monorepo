// somehow tsc does not pick up those types from `@sveltejs/kit` so we need to redeclare them here

declare module '@sveltejs/kit/vite' {
	import { Plugin } from 'vite';

	/**
	 * Returns the SvelteKit Vite plugins.
	 */
	export function sveltekit(): Promise<Plugin[]>;
	export { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
}
