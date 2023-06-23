/**
 * Interface to an object store which is flat mapped by `fsMap` and `fsStats`.
 * Subject to the condition that if a file exists in `fsMap` it must also exist
 * in the store.
 */
export type MappedObjectStore = {
	// Map assigning full filepaths to their corresponding Git object hashes
	fsMap: Map<string, Uint8Array>
	// Corresponding stat objects for each path.
	fsStats: Map<string, ObjectStats>
	// Reads an object from the underlying object store
	readObject: (oid: string) => Promise<{ type: string; object: Uint8Array }>
	// Writes an object to the underlying object store
	writeObject: (object: Uint8Array, type: string) => Promise<string | undefined>
	// Text decoder/encoder instances to share between function calls
	textEncoder: TextEncoder
	textDecoder: TextDecoder
}

export type ObjectStats = {
	mode: string
}
