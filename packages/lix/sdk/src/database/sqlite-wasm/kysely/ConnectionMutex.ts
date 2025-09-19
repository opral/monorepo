export class ConnectionMutex {
	#promise?: Promise<void>;
	#resolve?: () => void;

	async lock(): Promise<void> {
		while (this.#promise) {
			await this.#promise;
		}

		this.#promise = new Promise((resolve) => {
			this.#resolve = resolve;
		});
	}

	unlock(): void {
		const resolve = this.#resolve;

		this.#promise = undefined;
		this.#resolve = undefined;

		resolve?.();
	}
}
