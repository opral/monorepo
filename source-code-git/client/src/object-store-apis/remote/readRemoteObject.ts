export default async function fetchPackedObject(oid: string, url: string, options?: {
	headers: Record<string, string>
}) {
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
	
	return new Uint8Array(response.arrayBuffer)
}
