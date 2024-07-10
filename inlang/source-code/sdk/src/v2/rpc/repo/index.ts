import "../setup.js"
import type { Repository } from "@lix-js/client"
import * as Comlink from "comlink"

/**
 * Makes a repo available on an endpoint. Clients on the other side
 * can connect to it with `connectToRepo`. Call this on the main thread.
 */
export function exposeRepoOn(repo: Repository, ep: Comlink.Endpoint) {
	const _repo: Repository = {
		...repo,
		nodeishFs: Comlink.proxy(repo.nodeishFs),
	}

	Comlink.expose(_repo, ep)
}

/**
 * Connect to a repo that was made available on this endpoint with `makeRepoAvailableTo`.
 */
export function connectToRepo(ep: Comlink.Endpoint): Repository {
	const _repo = Comlink.wrap<Repository>(ep)

	// proxy _repo.nodeishFs.watch
	const repo = new Proxy(_repo, {
		get(getTarget: typeof _repo, prop: keyof typeof _repo) {
			if (prop === "nodeishFs") {
				return new Proxy(getTarget.nodeishFs, {
					get(fsTarget: typeof getTarget.nodeishFs, prop: any) {
						if (prop === "watch") {
							// make watch sync
							return async function* (...args: any[]) {
								// @ts-ignore
								yield* await _repo.nodeishFs.watch(...args)
							}
						}
						return (fsTarget as any)[prop]
					},
				})
			}
			return getTarget[prop]
		},
	})

	return repo as unknown as Repository
}
