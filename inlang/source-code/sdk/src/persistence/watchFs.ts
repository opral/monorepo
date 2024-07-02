import type { NodeishFilesystem } from "@lix-js/fs"
import type { Observable, Observer, Subscription } from "../v2/observables.js"
import _debug from "debug"
const debug = _debug("sdk:watchFs")

// lix FileChangeInfo eventType is always 'rename' on macOS - no point is using it
// see lix/packages/fs/src/NodeishFilesystemApi.ts
// https://github.com/nodejs/node/issues/7420
export type fsChangePath = string
export type watchFsState = "subscribed" | "unsubscribed"

/**
 * returns an observable that emits relative paths as they change below a base directory
 * events from this watcher feed into a multicast -> filtered observables
 * subscribers each get their own fs.watch, so not intended for direct use
 */
export function watchFs(args: {
	nodeishFs: NodeishFilesystem
	baseDir: string
}): Observable<fsChangePath> {
	const observable: Observable<string> = {
		["@@observable"]: () => observable,
		subscribe(observer: Observer<fsChangePath>): Subscription {
			debug(args.baseDir, "subscribe")
			let state: watchFsState = "unsubscribed"
			const abortController = new AbortController()

			startWatching()
				.then(() => {
					observer.complete()
					debug(args.baseDir, "complete")
					state = "unsubscribed"
				})
				.catch((err) => {
					if (err.name === "AbortError") {
						if (state === "subscribed") {
							observer.complete()
							debug(args.baseDir, "complete")
							state = "unsubscribed"
						}
					} else {
						if (state === "subscribed") {
							observer.error(err)
						}
						debug(args.baseDir, `error (${state})`, err)
						state = "unsubscribed"
					}
				})

			return {
				unsubscribe() {
					debug(args.baseDir, "unsubscribe")
					state = "unsubscribed"
					// don't trigger a complete after unsubscribe (TODO: check if this is correct)
					abortController.abort()
				},
			}

			async function startWatching() {
				const watcher = args.nodeishFs.watch(args.baseDir, {
					recursive: true,
					signal: abortController.signal,
				})
				state = "subscribed"
				for await (const event of watcher) {
					// @ts-expect-error
					if (state === "unsubscribed") {
						break
					} else if (event.filename) {
						debug(args.baseDir, "=>", event.filename)
						observer.next(event.filename)
					}
				}
			}
		},
	}
	return observable
}
