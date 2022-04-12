import type { Resource } from '@inlang/fluent-ast';
import { derived } from 'svelte/store';
import { page } from '$app/stores';
import { fs } from '$lib/stores/filesystem';
import { readInlangConfig, readResources } from '@inlang/core';
import type { InlangConfig } from '@inlang/config';
import git from 'isomorphic-git';

/**
 * (Typed) Search params.
 */
export const searchParams = derived<
	typeof page,
	{
		/** Current directory */
		dir: string;
	}
>(page, ($page, set) => {
	set({
		/**
		 * Falls back to root ('/') if the query paramater is not set.
		 *
		 * Makes the logic easier. If no subdirectory is specified, the user
		 * is in the root ('/') directory.
		 */
		dir: $page.url.searchParams.get('dir') ?? '/'
	});
});

export const inlangConfig = derived<
	[typeof searchParams, typeof fs],
	InlangConfig['any'] | undefined
>(
	[searchParams, fs],
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	async ([$searchParams, $fs], set) => {
		const ls = await $fs.readdir($searchParams.dir);
		if (ls.includes('inlang.config.json')) {
			try {
				const config = (
					await readInlangConfig({
						fs: $fs,
						path: $searchParams.dir + 'inlang.config.json'
					})
				).unwrap();
				set(config);
			} catch (error) {
				alert((error as Error).message);
			}
		} else {
			// is always defined from the layout. thus, ignore
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			set(undefined);
		}
	}
);

/**
 * Resources.
 */
export const resources = createResourcesStore();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createResourcesStore() {
	// derived from search params -> if directory changes
	// derived from fs -> if files change
	const { subscribe } = derived<
		[typeof searchParams, typeof fs],
		Record<string, Resource | undefined>
	>(
		[searchParams, fs],
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		async ([$searchParams, $fs], set) => {
			const ls = await $fs.readdir($searchParams.dir);
			if (ls.includes('inlang.config.json')) {
				try {
					const config = (
						await readInlangConfig({
							fs: $fs,
							path: $searchParams.dir + 'inlang.config.json'
						})
					).unwrap();
					const _resources = (
						await readResources({ fs: $fs, directory: $searchParams.dir, ...config })
					).unwrap();
					set(_resources);
				} catch (error) {
					console.error(error);
					alert((error as Error).message);
				}
			} else {
				// is always defined from the layout. thus, ignore
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				set(undefined);
			}
		}
	);
	return {
		subscribe
	};
}
