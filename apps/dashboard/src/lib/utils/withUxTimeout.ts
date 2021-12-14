import { uxPromiseTimeout } from './timeouts';

/**
 * For nicer ux, wait at least x milliseconds even if the callback
 * finishes earlier.
 *
 * The helper function enables nicer UX/UI loading spinners etc.
 *
 * @param callback the function
 */
export async function withUxTimeout<T>(callback: () => Promise<T>): Promise<T> {
	const result = await Promise.all([
		callback(),
		new Promise((resolve) => setTimeout(resolve, uxPromiseTimeout))
	]);
	// take the first element of the promise chain -> `callback`
	return result[0];
}
