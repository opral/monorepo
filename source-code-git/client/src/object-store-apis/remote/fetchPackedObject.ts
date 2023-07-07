/*
 * Fetch a packfile containing a single object from the remote. 
 *
 * The packfile sent will be multiplexed, and must be demultiplexed with
 * `demuxPackfile`.
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
	); // "000dpackfile\n"

	for (let i = 0; i < validHeader.length; ++i) {
		if (object[i] !== validHeader[i])
			throw new Error(`Invalid header: ${new TextDecoder().decode(object.subarray(0,13))}}`)
	}

	return object.subarray(13)
}
