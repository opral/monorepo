import type { NodeishFilesystem } from "@lix-js/fs";
import { fetchBlobsFromRemote } from "./fetchBlobsFromRemote.js";

let nextFetchOids = undefined as undefined | Set<string>;
let requestedFetches = [] as { resolve: (value: unknown) => void, reject: (reason?: any) => void}[];

/**
 * A throttled variant of fetchBlobsFromRemote. 
 * This method takes all calls of it happening in the same "tick" (utilizing setTimeout(1) to be browser compatible) and batches 
 * them to one call of fetchBlobsFromRemote containing all requested oid's.
 */
export async function fetchBlobsFromRemoteThrottled(args: {
	fs: NodeishFilesystem
	gitdir: string
	http: any
	ref: string
	oids: string[]
}) {
	const fetchRequestPromise = new Promise((resolve, reject) => {
		requestedFetches.push({
			reject,
			resolve,
		})
	})

	if (nextFetchOids === undefined) {
		nextFetchOids = new Set<string>()

		for (const oid of args.oids) nextFetchOids.add(oid)
		// NOTE: there is no nextTick in browser env - we fall back to timeout of 1 ms
		setTimeout(() => {
			if (!nextFetchOids) {
				throw new Error("next nextFetchOids was manipulated somehow from the outside?")
			}
			const oIdsToFetch = [...nextFetchOids]
			nextFetchOids = undefined
			const requestedFetchesBatch = [...requestedFetches]
			requestedFetches = []
			fetchBlobsFromRemote({
				fs: args.fs,
				gitdir: args.gitdir,
				http: args.http,
				ref: args.ref,
				oids: oIdsToFetch,
			})
				.then((value) => {
					for (const request of requestedFetchesBatch) {
						request.resolve(value)
					}
				})
				.catch((reason) => {
					for (const request of requestedFetchesBatch) {
						request.reject(reason)
					}
				})
		}, 1)
	} else {
		for (const oid of args.oids) {
			nextFetchOids.add(oid)
		}
	}

	return fetchRequestPromise
}