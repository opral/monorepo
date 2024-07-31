type Mutex = {
	lock: () => Promise<void>;
	unlock: () => Promise<void>;
};

export function createMutex(): Mutex {
	let promise: Promise<void> | undefined;
	let resolve: (() => void) | undefined;

	const lock = async () => {
		while (promise) {
			await promise;
		}

		promise = new Promise((res) => {
			resolve = res;
		});
	};

	const unlock = async () => {
		const res = resolve;
		promise = undefined;
		resolve = undefined;
		res?.();
	};

	return { lock, unlock };
}
