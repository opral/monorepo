import { inflateRaw } from "pako"
/*
 * Given a packfile containing only one object, extract that object from the
 * packfile and return the object in uncompressed loose object format
 */
export default function extractPackedObject(packfile: Uint8Array) {
	if (packfile[7] !== 2) throw new Error(`Incorrect packfile version: ${packfile[7]}`)

	// The object type is encoded in the last 3 bits (excluding the
	// continuation bit) of the first (last) byte of the variable length
	// bitstring encoding the object size. confusing? yes.
	const type =
		(packfile[12] ?? 0 & 0b01110000) === 0b00100000
			? new Uint8Array([0x74, 0x72, 0x65, 0x65, 0x20]) // "tree "
			: new Uint8Array([0x62, 0x6c, 0x6f, 0x62, 0x20]) // "blob "

	// Find the index where the object size bitstring ends
	let i
	for (i = 12; ((packfile[i] ?? 0) & 0b10000000) !== 0; ++i);

	// The only difference between a packed loose object and a single object in
	// a packfile is the packfile data surrounding it, so strip that off
	// First 2 bytes are the zlib header, and last 20 bytes are the pack checksum
	const data = inflateRaw(packfile.subarray(i + 3, -20))

	const lenString = new TextEncoder().encode(data.length.toString())

	const object = new Uint8Array(type.length + lenString.length + 1 + data.length)
	object.set(type, 0)
	object.set(lenString, 5)
	object[5 + lenString.length] = 0x00
	object.set(data, 6 + lenString.length)

	return object
}
