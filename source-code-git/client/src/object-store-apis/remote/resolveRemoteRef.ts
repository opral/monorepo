import { lsRefs, fetchRemoteObject } from "./index.js"

/*
 * Resolves a remote ref to the object id of the underlying tree object.
 */
const resolveRemoteRef = async (targetRef: string, url: string, headers?: Record<string, string>) =>
	lsRefs(url, headers)
		.then((refs) => fetchRemoteObject(refs[targetRef] as string, url, headers))
		.catch(() => {
			throw new Error(`Could not fetch remote ref '${targetRef}'`)
		})
		.then(({ object, type }) => {
			if (type === "commit") return new TextDecoder().decode(object.subarray(5, 45))
			throw new Error(`Could not resolve remote ref of invalid type: ${type}`)
		})

export default resolveRemoteRef
