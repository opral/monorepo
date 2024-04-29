import { encodePackLine, decodeGitPackLines } from "./helpers.js"

export async function optimizedRefsReq({
	url,
	addRef,
}: {
	url: string
	addRef?: string
	body?: any
}) {
	// "http://localhost:3001/git-proxy//github.com/inlang/example/info/refs?service=git-upload-pack"
	if (!url.endsWith("info/refs?service=git-upload-pack")) {
		return
	}

	// create new url
	const uploadPackUrl = url.replace("info/refs?service=git-upload-pack", "git-upload-pack")
	// create new body
	const lines = []

	lines.push(encodePackLine("command=ls-refs"))
	// 0001 - Delimiter Packet (delim-pkt) - separates sections of a message
	lines.push(encodePackLine("agent=git/isomorphic-git@1.24.5") + "0001")
	// we prefix refs/heads hardcoded here since the ref is set to main....
	if (addRef) {
		lines.push(encodePackLine("ref-prefix refs/heads/" + addRef))
	}
	lines.push(encodePackLine("ref-prefix HEAD"))
	lines.push(encodePackLine("symrefs"))
	lines.push(encodePackLine(""))

	return {
		url: uploadPackUrl,
		method: "POST",
		headers: {
			accept: "application/x-git-upload-pack-result",
			"content-type": "application/x-git-upload-pack-request",
			"git-protocol": "version=2",
		},
		// here we expect the body to be a string - we can just use the array and join it
		body: lines.join(""),
	}
}

export async function optimizedRefsRes({
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
	if (!origUrl.endsWith("info/refs?service=git-upload-pack")) {
		return
	}

	if (statusCode !== 200) {
		return
	} else {
		let headSymref = ""

		const origLines = decodeGitPackLines(resBody)
		const rewrittenLines = ["# service=git-upload-pack\n", ""]

		const capabilites =
			"\x00multi_ack thin-pack side-band side-band-64k ofs-delta shallow deepen-since deepen-not deepen-relative no-progress include-tag multi_ack_detailed allow-tip-sha1-in-want allow-reachable-sha1-in-want no-done filter object-format=sha1"

		for (const line of origLines) {
			if (line.includes("HEAD symref-target")) {
				// 0050d7e62aef79d771d1771cb44c9e01faa4b7a607fe HEAD symref-target: -> length
				headSymref = "refs" + line.slice(64)
				headSymref = headSymref.endsWith("\n") ? headSymref.slice(0, -1) : headSymref
				const headBlob = line.slice(0, 40)
				rewrittenLines.push(headBlob + " HEAD" + capabilites + " symref=HEAD:" + headSymref)

				rewrittenLines.push(headBlob + " " + headSymref)
			} else {
				rewrittenLines.push(line)
			}
		}

		rewrittenLines.push("")

		resHeaders["content-type"] = "application/x-git-upload-pack-advertisement"

		const bodyString = rewrittenLines
			.map((updatedRawLine) => encodePackLine(updatedRawLine))
			.join("")

		return {
			resHeaders,

			resBody: [new TextEncoder().encode(bodyString)],
		}
	}
}
