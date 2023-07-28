export default async function lsRefs(
	url: string,
	headers?: Record<string, string>,
): Promise<Record<string, string>> {
	headers = {
		...headers,
		"Content-Type": "application/x-git-upload-pack-request",
		"Git-Protocol": "version=2",
	}
	url = `${url}/git-upload-pack`
	const response = await fetch(url, {
		headers,
		method: "POST",
		body: "0013command=ls-refs00010000",
	})

	if (response.status !== 200) throw new Error(`Network error: ${response.status}`)

	const responseText = await response.text()
	if (responseText.length < 46) throw new Error(`ls-refs: invalid response '${responseText}'`)

	return responseText
		.split("\n")
		.reduce(
			(refsObj, ref) =>
				ref[3] !== "0" ? Object.assign(refsObj, { [ref.slice(45)]: ref.slice(4, 44) }) : refsObj,
			{},
		)
}
