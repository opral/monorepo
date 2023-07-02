//TODO: Test with trees larger than 64k
/*
 * Fetch a packfile containing a single object from the remote and return the
 * object in loose object format.
 */
export default async function fetchPackedObject(
	oid: string, 
	url: string,
	headers?: Record<string, string>
): Uint8Array {
	headers = {
		...headers, 
		"Content-Type": "application/x-git-upload-pack-request"
		"Git-Protocol": "version=2"
	} 

	url = `${url}/git-upload-pack`

	const response = await fetch(url, {
		headers,
		method: "POST",
		body: "0012command=fetch\n"
		+ "0001"
		+ "0031want " + oid
		+ "0012filter tree:0\n"
		+ "0009done\n"
		+ "0000"
	})

	if (response.status !== 200) throw new Error(response.statusText)
	
}
