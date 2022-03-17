import FS, { PromisifedFS } from '@isomorphic-git/lightning-fs';
import { writable } from 'svelte/store';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const _fs = new FS('fs', { wipe: true });

/**
 * Promise based fs (filesystem) store.
 *
 * FS is not reative. Thus, the store has a `refresh` method
 * that triggers a rebuild of all components that use this store.
 */
export const fs = createFsStore();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createFsStore() {
	const { subscribe, set } = writable<PromisifedFS>(_fs.promises);

	return {
		subscribe,
		/**
		 * Refresh the store, aka trigger rebuild of components that use fs.
		 */
		refresh: () => {
			set(_fs.promises);
		},
		/**
		 * Callback based fs.
		 *
		 * Used for isomorphic-git which does not work with a promise based fs.
		 */
		callbackBased: _fs
	};
}

/**
 * Prefixes a slash to a path if required.
 *
 * LightningFS has problems with relative paths.
 */
export function normalize(path: string): string {
	let result = path;
	// prefix with slash
	if (path.at(0) !== '/') {
		result = '/' + path;
	}
	return result;
}
