/**
 * NextJS executes `next.config.js` twice on startup.
 * This function ensures that the callback is only executed once.
 * @param callback
 */
export function once<T>(callback: () => T): T | void {
	if (process.env.NEXT_PRIVATE_WORKER) {
		return
	}
	return callback()
}
