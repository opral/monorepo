/**
 * Polls a function every given time and calls a callback with the result.
 *
 * @example
 *   poll({
 *     every: 1000,
 *     fn: () => fetch("https://example.com"),
 *     callback: console.log
 *   })
 */
export function poll<T>(args: {
	every: number;
	fn: () => T;
	cb?: (value: Awaited<T>) => void;
}) {
	const poll = async () => {
		const value = await args.fn();
		args.cb?.(value);
		setTimeout(poll, args.every);
	};

	poll();
}
