import type { NodeishFilesystem } from "@lix-js/fs"
import type { Observable, Observer, Subscription } from "../v2/observables.js"
import _debug from "debug"
const debug = _debug("sdk:watchFs")

// lix FileChangeInfo eventType is always 'rename' on macOS - no point is using it
// see lix/packages/fs/src/NodeishFilesystemApi.ts
// https://github.com/nodejs/node/issues/7420
export type fsChangePath = string

/**
 * returns an observable that emits relative paths as they change below a base directory
 * events from this watcher feed into a multicast -> filtered observables
 * subscribers each get their own fs.watch, so not intended for direct use
 */
export function watchFs(args: {
	nodeishFs: NodeishFilesystem
	baseDir: string
}): Observable<fsChangePath> {
	return {
		subscribe(observer: Observer<fsChangePath>): Subscription {
			const abortController = new AbortController()

			startWatching()
				.then(() => observer.complete())
				.catch((err) => {
					if (err.name === "AbortError") {
						debug(args.baseDir, "complete")
						observer.complete()
					} else {
						observer.error(err)
						debug(args.baseDir, "error", err)
					}
				})

			return {
				unsubscribe() {
					abortController.abort()
				},
			}

			async function startWatching() {
				const watcher = args.nodeishFs.watch(args.baseDir, {
					recursive: true,
					signal: abortController.signal,
				})
				for await (const event of watcher) {
					if (event.filename) {
						debug(args.baseDir, "=>", event.filename)
						observer.next(event.filename)
					}
				}
			}
		},
	}
}
