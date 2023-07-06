import type { NodeishFilesystem } from "@inlang-git/fs"
//TODO: Test with trees larger than 64k
/*
 * Fetch a packfile containing a single object from the remote
 */
export async function fetchPackedObject(
	oid: string, 
	url: string,
	headers?: Record<string, string>
): Promise<Uint8Array | undefined> {
	headers = {
		...headers, 
		"Content-Type": "application/x-git-upload-pack-request",
		"Git-Protocol": "version=2"
	} 

	url = `${url}/git-upload-pack`

	const response = await fetch(url, {
		headers,
		method: "POST",
		body: "0012command=fetch\n"
		+ "0001"
		+ "0031want " + oid
		+ "0010no-progress\n"
		+ "0012filter tree:0\n"
		+ "0009done\n"
		+ "0000"
	})

	if (response.status !== 200) throw new Error(`Network error: ${response.status}`)

	const object = new Uint8Array(await response.arrayBuffer())

	const validHeader = new Uint8Array(
		[ 0x30, 0x30, 0x30, 0x64, 0x70, 0x61, 0x63,
								0x6B, 0x66, 0x69, 0x6C, 0x65, 0x0A ]
	);

	for (let i = 0; i < validHeader.length; ++i) {
		if (object[i] !== validHeader[i])
			throw new Error(`Invalid header: ${new TextDecoder().decode(object.subarray(0,13))}}`)
	}

	return object.subarray(13)
}

/*
 * Demultiplex a "multiplexed" packfile as sent via wire protocol v2. 
 *
 * All pack data is assumed to have been sent on a single sideband channel as with
 * the `no-progress` option to upload-pack.
 */
export function demuxPackfile(packData: Uint8Array) {
	let offset = 0
	let pktLength = 0
	let pktsProcessed = 0
	
	const decoder = new TextDecoder()

	// For each packet, shift the contents backwards, clobbering the length and
	// sideband information
	while (pktLength = parseInt(decoder.decode(packData.subarray(offset, offset += 5)), 16))
		packData.copyWithin(offset - 5 * ++pktsProcessed, offset, offset += pktLength - 5)

	// We shifted the contents backwards, so cut off the end since it contains
	// garbage data
	return packData.subarray(0, packData.length - (++pktsProcessed * 5) + 1)
}

export function extractObjectFromPackfile(packfile: Uint8Array) {
}

/*
 * Given a packed object, parse and write it to the appropriate location in
 * `gitdir` on the filesystem `fs`
 */
async function writePackedObjectToDir(
	object: ArrayBuffer,
	gitdir: string,
	fs: NodeishFilesystem
) {
	const pack = demuxPackfile(new Uint8Array(object))
}
