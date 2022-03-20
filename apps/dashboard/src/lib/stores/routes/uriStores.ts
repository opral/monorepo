import { Resources } from '@inlang/fluent-ast';
import { derived } from 'svelte/store';
import { page } from '$app/stores';
import { fs } from '$lib/stores/filesystem';
import { readInlangConfig, readResources } from '@inlang/core';
import { InlangConfig } from '@inlang/config';

/**
 * Search params of uri routes.
 */
export const searchParams = derived<
	typeof page,
	{
		/** Current directory */
		dir: string;
	}
>(page, ($page, set) => {
	set({
		dir: $page.url.searchParams.get('dir') ?? '/'
	});
});

export const inlangConfig = derived<[typeof searchParams, typeof fs], InlangConfig['any']>(
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
	const { subscribe } = derived<[typeof searchParams, typeof fs], Resources>(
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
					alert((error as Error).message);
				}
			} else {
				set(undefined);
			}
		}
	);
	return {
		subscribe
	};
}
