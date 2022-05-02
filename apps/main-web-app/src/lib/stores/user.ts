import { writable } from 'svelte/store';

/**
 * User of the application
 *
 * Is used for commits. Initalized with dummy values.
 */
export const user = writable({
	name: 'unknown',
	email: 'none-existent@inlang.dev'
});
