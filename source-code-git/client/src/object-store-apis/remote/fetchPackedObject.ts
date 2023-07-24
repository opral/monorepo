/*
 * Fetch a packfile containing a single object from the remote.
 *
 * The packfile sent will be multiplexed, and must be demultiplexed with
 * `demuxPackfile`.
 */
export async function fetchPackedObject(
	oid: string,
	url: string,
	headers?: Record<string, string>,
): Promise<Uint8Array | undefined> {
	headers = {
		...headers,
		"Content-Type": "application/x-git-upload-pack-request",
		"Git-Protocol": "version=2",
	}

	url = `${url}/git-upload-pack`

	const response = await fetch(url, {
		headers,
		method: "POST",
		body:
			"0012command=fetch\n" +
			"0001" +
			"0031want " +
			oid +
			"0010no-progress\n" +
			"0012filter tree:0\n" +
			"0009done\n" +
			"0000",
	})

	if (response.status !== 200) throw new Error(`Network error: ${response.status}`)

	const object = new Uint8Array(await response.arrayBuffer())

	const validHeader = new Uint8Array([
		0x30, 0x30, 0x30, 0x64, 0x70, 0x61, 0x63, 0x6b, 0x66, 0x69, 0x6c, 0x65, 0x0a,
	]) // "000dpackfile\n"

	for (let i = 0; i < validHeader.length; ++i) {
		if (object[i] !== validHeader[i])
			throw new Error(`Invalid header: ${new TextDecoder().decode(object.subarray(0, 13))}}`)
	}

	return demuxPackfile(object.subarray(13))
}

/*
 * Demultiplex a "multiplexed" packfile as sent via wire protocol v2. 
 *
 * Assumes only a single sideband channel has beend used, as with the
 * `no-progress` option to upload-pack.
 */
function demuxPackfile(packData: Uint8Array) {
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
