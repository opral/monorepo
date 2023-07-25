import type { MappedObjectStore } from "./store/types.js"

import { fetchRemoteObject } from "./remote/index.js"

/*
 * Creates an interface to a remote object store from a mapped object store. If
 * an object cannot be read from the local object store we attempt to fetch it
 * from the specified remote.
 */
export default async function createRemoteMappedObjectStore(
	objectStore: MappedObjectStore,
	remoteUrl: string,
	headers?: Record<string, string>
) {
	return {
		...objectStore,
		readObject: (oid: string) => 
			objectStore.readObject(oid)
			.catch((e) => fetchRemoteObject(oid, remoteUrl, headers))
	}
}
