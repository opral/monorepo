import type { NodeishFilesystem } from "@lix-js/fs";
import { fetch } from "isomorphic-git"
import { httpWithLazyInjection } from "./httpWithLazyInjection.js"

/***
 * Takes a list of oids (the hashes of the content of the files we are asking for) and uses isomorphic-git's fetch to send a fetch request to git.
 * By intercepting the http request we override the want's section to only contain the passed oids and add the capabilities allow-tip-sha1-in-want allow-reachable-sha1-in-want no-progress to accept the request of oid's explicetly
 * 
 * After this method has executed a request to blob exists locally returns true, and a checkout of a file with the conents behind the hash can be executed sucessfully
 */
export async function fetchBlobsFromRemote(args: {
	fs: NodeishFilesystem
	gitdir: string
	http: any
	ref: string
	oids: string[]
}) {
	return fetch({
		fs: args.fs,
		gitdir: args.gitdir,
		// this time we fetch with blobs but we skip all objects but the one that was requested by fs
		http: httpWithLazyInjection(args.http, {
			noneBlobFilter: false,
			// we don't need to override the haves any more since adding the capabilities
			// allow-tip-sha1-in-want allow-reachable-sha1-in-want to the request enable us to request objects explicetly
			filterRefList: { ref: args.ref },
			overrideHaves: undefined,
			overrideWants: args.oids,
		}),
		depth: 1,
		singleBranch: true,
		tags: false,
	})
}
