import {
	decodeGitPackLines,
	addBlobNoneFilter,
	overrideHaves,
	addWantsCapabilities,
	overrideWants,
	encodePackLine,
	addNoProgress,
} from "./helpers.js"

/***
 * This takes the request, decodes the request body and extracts each line in the format of the git-upload-pack protocol (https://git-scm.com/docs/gitprotocol-v2)
 * and allows us to rewrite the request to add filters like blob:none or request only specific oids (overrideWants) or block list specific oids (overrideHaves)
 */
export async function optimizeReq(
	gitConfig: {
		// rename to noBlobs: true
		noneBlobFilter?: boolean

		// addRefs?: []string
		filterRefList?: {
			// TODO: simplify
			ref: string | undefined
		}

		overrideHaves?: string[]
		overrideWants?: string[]
	} = {},
	{
		method,
		url,
		body,
	}: {
		method: string
		url: string
		body?: any
	}
) {
	// Optimize refs requests, GET info/refs?service=git-upload-pack is a request to get the refs but does not support filtering, we rewrite this to a post upload pack v2 request that allows filetering refs how we want
	// FIXME: document url + method api, how to get tree for commit just filter file blobs
	// "http://localhost:3001/git-proxy//github.com/inlang/example/info/refs?service=git-upload-pack"
	if (url.endsWith("info/refs?service=git-upload-pack") && gitConfig.filterRefList !== undefined) {
		const uploadPackUrl = url.replace("info/refs?service=git-upload-pack", "git-upload-pack")
		const lines = []

		// TODO: #1459 check if we have to ask for the symrefs
		lines.push(encodePackLine("command=ls-refs"))

		// 0001 - Delimiter Packet (delim-pkt) - separates sections of a message
		lines.push(encodePackLine("agent=lix") + "0001")

		// TODO #1459 we prefix refs/heads hardcoded here since the ref is set to main....
		if (gitConfig.filterRefList?.ref) {
			lines.push(encodePackLine("ref-prefix refs/heads/" + gitConfig.filterRefList?.ref))
		}

		lines.push(encodePackLine("ref-prefix HEAD"))

		// TODO: what does this do?
		lines.push(encodePackLine("symrefs"))
		// empty line for empty symrefs
		lines.push(encodePackLine(""))

		return {
			url: uploadPackUrl,
			body: lines.join(""),
			method: "POST",
			headers: {
				accept: "application/x-git-upload-pack-result",
				"content-type": "application/x-git-upload-pack-request",
				"git-protocol": "version=2",
			},
		}
	}

	// Post requests are always /git-upload-pack requests for the features we currently optimize
	// && url.endsWith("/git-upload-pack")
	if (method === "POST") {
		// decode the lines to be able to change them
		let rawLines = decodeGitPackLines(body)

		// We modify the raw lines without encoding, we encode them later at once
		if (gitConfig.noneBlobFilter) {
			rawLines = addBlobNoneFilter(rawLines)
		}

		if (gitConfig.overrideHaves) {
			rawLines = overrideHaves(rawLines, gitConfig.overrideHaves)
		}

		rawLines = addNoProgress(rawLines)

		// todo add caps helper and always add no progress!
		if (gitConfig.overrideWants) {
			rawLines = addWantsCapabilities(rawLines)
			rawLines = overrideWants(rawLines, gitConfig.overrideWants)
		}

		// encode lines again to send them in a reques
		const newBody = rawLines.map((updatedRawLine: any) => encodePackLine(updatedRawLine)).join("")

		// console.log({ newBody, method, url, body, gitConfig })
		return {
			body: newBody,
		}
	}

	return undefined
}

export async function optimizeRes({
	origUrl,
	resBody,
	statusCode,
	resHeaders,
}: {
	origUrl: string
	usedUrl: string
	resBody: Uint8Array
	statusCode: number
	resHeaders: Record<string, string>
}) {
	// We only optimize ref requests
	if (!origUrl.endsWith("info/refs?service=git-upload-pack") || statusCode !== 200) {
		return undefined
	}

	// TODO: document why we need to override cpabilities
	const capabilites = [
		"multi_ack",
		"thin-pack",
		"side-band",
		"side-band-64k",
		"ofs-delta",
		"shallow",
		"deepen-since",
		"deepen-not",
		"deepen-relative",
		"no-progress",
		"include-tag",
		"multi_ack_detailed",
		"allow-tip-sha1-in-want",
		"allow-reachable-sha1-in-want",
		"no-done",
		"filter",
		"object-format=sha1",
	]

	const origLines = decodeGitPackLines(resBody)
	const rewrittenLines = ["# service=git-upload-pack\n", ""]

	let headSymref = ""
	for (const line of origLines) {
		if (line.includes("HEAD symref-target")) {
			// 0050d7e62aef79d771d1771cb44c9e01faa4b7a607fe HEAD symref-target: -> length
			headSymref = "refs" + line.slice(64)
			headSymref = headSymref.endsWith("\n") ? headSymref.slice(0, -1) : headSymref
			const headBlob = line.slice(0, 40)
			rewrittenLines.push(
				headBlob + " HEAD" + "\x00" + capabilites.join(" ") + " symref=HEAD:" + headSymref
			)

			rewrittenLines.push(headBlob + " " + headSymref)
		}
	}

	rewrittenLines.push("")

	resHeaders["content-type"] = "application/x-git-upload-pack-advertisement"
	const bodyString = rewrittenLines.map((updatedRawLine) => encodePackLine(updatedRawLine)).join("")

	return {
		resHeaders,
		resBody: [new TextEncoder().encode(bodyString)],
	}
}
