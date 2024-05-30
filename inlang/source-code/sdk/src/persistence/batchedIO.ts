import _debug from "debug"
const debug = _debug("sdk:batchedIO")

/**
 * Converts async save() into batched async save()
 * Batches saves while waiting to acquire a lock.
 * Resolves queued requests after the batched save completes.
 * Recursively batches requests during current save into the next batch.
 */
export function batchedIO(
	acquireLock: () => Promise<number>,
	releaseLock: (lock: number) => Promise<void>,
	save: () => Promise<void>
): (id: string) => Promise<string> {
	// 3-state machine
	let state: "idle" | "acquiring" | "saving" = "idle"

	// Hold requests while acquiring, resolve after saving
	// TODO: rejectQueued if save throws (maybe?)
	type Queued = {
		id: string
		resolve: (value: string) => void
		reject: (reason: any) => void
	}
	const queue: Queued[] = []

	// initialize nextBatch lazily, reset after saving
	let nextBatch: ((id: string) => Promise<string>) | undefined = undefined

	// batched save function
	return async (id: string) => {
		if (state === "idle") {
			state = "acquiring"
			const lock = await acquireLock()
			state = "saving"
			await save()
			await releaseLock(lock)
			resolveQueued()
			nextBatch = undefined
			state = "idle"
			return id
		} else if (state === "acquiring") {
			return new Promise<string>((resolve, reject) => {
				queue.push({ id, resolve, reject })
			})
		} else {
			// state === "saving"
			nextBatch = nextBatch ?? batchedIO(acquireLock, releaseLock, save)
			return await nextBatch(id)
		}
	}

	function resolveQueued() {
		debug("batched", queue.length + 1)
		for (const { id, resolve } of queue) {
			resolve(id)
		}
		queue.length = 0
	}
}
