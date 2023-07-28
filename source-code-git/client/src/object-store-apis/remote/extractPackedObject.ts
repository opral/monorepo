import { inflateRaw } from "pako"
/*
 * Given a packfile containing only one object, extract that object from the
 * packfile and return the object in uncompressed loose object format
 */
export default function extractPackedObject(packfile: Uint8Array) {
	if (packfile[7] !== 2) throw new Error(`Incorrect packfile version: ${packfile[7]}`)

	// The object type is encoded in the most significant 3 bits (excluding the
	// continuation bit) of the earliest (least significant) byte of the variable
	// length bitstring encoding the object size. confusing? yes.
	let type
	switch ((packfile[12] ?? 0) & 0b01110000) {
		case 0b00010000:
			type = "commit"
		break
		case 0b00100000:
			type = "tree"
		break
		case 0b00110000:
			type = "blob"
		break
		case 0b01000000:
			type = "tag"
		break
		default:
			throw new Error(`Invalid object type:, ${((packfile[12] ?? 0) & 0b01110000) >> 4}`)
	}
	// Find the index where the object size bitstring ends
	let i
	for (i = 12; ((packfile[i] ?? 0) & 0b10000000) !== 0; ++i);

	// The only difference between a packed loose object and a single object in
	// a packfile is the packfile data surrounding it, so strip that off
	// First 2 bytes are the zlib header, and last 20 bytes are the pack checksum
	const object = inflateRaw(packfile.subarray(i + 3, -20))

	return { type, object }
}
