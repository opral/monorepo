import type { NodeishFilesystem } from "@lix-js/fs"
// we need readObject to use format deflated, possibly move to _readObject later
import { readObject } from "../../vendored/isomorphic-git/index.js"

export function dirname(path: string) {
	const last = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"))
	if (last === -1) return "."
	if (last === 0) return "/"
	return path.slice(0, last)
}

export function basename(path: string) {
	const last = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"))
	if (last > -1) {
		path = path.slice(last + 1)
	}
	return path
}

function padHex(pad: number, n: number) {
	const s = n.toString(16)
	return "0".repeat(pad - s.length) + s
}

const WANT_PREFIX = "want "

/*
 * overrides all wants in the given lines with the ids provided in oids
 *
 * a set of orginal lines used to fetch a commit
 * [
 * "want d7e62aef79d771d1771cb44c9e01faa4b7a607fe multi_ack_detailed no-done side-band-64k ofs-delta agent=git/isomorphic-git@1.24.5\n",
 * "deepen 1\n",
 * "", // flush
 * "done\n",
 * ]
 * with an array of oids passed like
 * [
 *   "1111111111111111111111111111111111111111",
 *   "2222222222222222222222222222222222222222",
 * ]
 *
 * would result in:
 * [
 * "want 1111111111111111111111111111111111111111 multi_ack_detailed no-done side-band-64k ofs-delta agent=git/isomorphic-git@1.24.5\n",
 * "want 2222222222222222222222222222222222222222\n"
 * "deepen 1\n",
 * "", // flush
 * "done\n",
 * ]
 *
 * @param lines the lines of the original request
 * @returns the updated lines with wants lines containing the passed oids
 */
export function overrideWants(lines: string[], oids: string[]) {
	const newLines = []
	let wantsCount = 0

	let lastLineWasAWants = false

	// override existing wants
	for (const line of lines) {
		if (line.startsWith(WANT_PREFIX)) {
			lastLineWasAWants = true
			if (oids.length > wantsCount) {
				const postOidCurrentLine = line.slice(
					Math.max(0, WANT_PREFIX.length + oids[wantsCount]!.length)
				)
				newLines.push(`${WANT_PREFIX}${oids[wantsCount]}${postOidCurrentLine}`)
			}
			wantsCount += 1
		}

		if (!line.startsWith(WANT_PREFIX)) {
			if (lastLineWasAWants && oids.length > wantsCount) {
				while (oids.length > wantsCount) {
					newLines.push(WANT_PREFIX + oids[wantsCount] + "\n")
					wantsCount += 1
				}
				lastLineWasAWants = false
			}
			newLines.push(line)
		}
	}

	return newLines
}

/*
 *
 * adds "allow-tip-sha1-in-want", "allow-reachable-sha1-in-want" and "no-progress" as capabilities (appends it to the first wants line found) to be able to fetch specific blobs by there hash
 * compare: https://git-scm.com/docs/git-rev-list#Documentation/git-rev-list.txt---filterltfilter-specgt
 *
 * The Orginal lines without the capabilities could look like this:
 *
 * [
 * "want d7e62aef79d771d1771cb44c9e01faa4b7a607fe multi_ack_detailed no-done side-band-64k ofs-delta agent=git/isomorphic-git@1.24.5\n",
 * "deepen 1\n",
 * "", // flush
 * "done\n",
 * ]
 * ----
 *
 *
 * The returned lines will look like this:
 *
 * [
 * "want d7e62aef79d771d1771cb44c9e01faa4b7a607fe multi_ack_detailed no-done side-band-64k ofs-delta agent=git/isomorphic-git@1.24.5 allow-tip-sha1-in-want allow-reachable-sha1-in-want no-progress\n",
 * "deepen 1\n",
 * "", // flush
 * "done\n",
 * ]
 *
 * @param lines the lines of the original request
 * @returns
 */
export function addWantsCapabilities(lines: string[]) {
	let capabilitiesAdded = false
	const updatedLines = []
	for (let line of lines) {
		if (line.startsWith(WANT_PREFIX) && !capabilitiesAdded) {
			// lets take the original line withouth the trailing \n and add the new capabilities
			// no-progress to skip informal stream that gives input about objects packed etc (https://git-scm.com/docs/protocol-capabilities#_no_progress)
			// allow-tip-sha1-in-want allow-reachable-sha1-in-want to use wants  https://git-scm.com/docs/protocol-capabilities#_allow_reachable_sha1_in_want // TODO #1459 check what if we can only use  allow-reachable-sha1-in-want
			line =
				line.slice(0, Math.max(0, line.length - 1)) +
				" allow-tip-sha1-in-want allow-reachable-sha1-in-want\n"
			line = line.replace("ofs-delta", "")
			capabilitiesAdded = true
		}
		updatedLines.push(line)
	}
	return updatedLines
}
export function addNoProgress(lines: string[]) {
	let capabilitiesAdded = false
	const updatedLines = []
	for (let line of lines) {
		if (line.startsWith(WANT_PREFIX) && !capabilitiesAdded) {
			line = line.slice(0, Math.max(0, line.length - 1)) + " no-progress\n"
			capabilitiesAdded = true
		}
		updatedLines.push(line)
	}
	return updatedLines
}

/*
 *
 * adds filter=blob:none to the request represented by the given lines
 * compare: https://git-scm.com/docs/git-rev-list#Documentation/git-rev-list.txt---filterltfilter-specgt
 *
 * The Orginal lines without blob filter could look like this:
 *
 * [
 * "want d7e62aef79d771d1771cb44c9e01faa4b7a607fe multi_ack_detailed no-done side-band-64k ofs-delta agent=git/isomorphic-git@1.24.5",
 * "deepen 1",
 * "",
 * "done",
 * ]
 * ----
 *
 * The returned lines will add the filter as capability into the first want line and adds filter blob:none after the deepen 1 line
 *
 * The returned lines will look like this:
 *
 * [
 * "want d7e62aef79d771d1771cb44c9e01faa4b7a607fe multi_ack_detailed no-done side-band-64k ofs-delta agent=git/isomorphic-git@1.24.5 filter",
 * "deepen 1",
 * "filter blob:none"
 * "",
 * "done",
 * ]
 *
 * @param lines the lines of the original request
 * @returns
 */
export function addBlobNoneFilter(lines: string[]) {
	let filterCapabilityAdded = false
	let filterAdded = false

	const updatedLines = []
	const flushLine = ""

	for (let line of lines) {
		// finds the first wants line - and append the filter capability and adds "filter" after last wants line - this is capability declaration is needed for filter=blob:none to work
		// see: https://git-scm.com/docs/protocol-capabilities#_filter
		if (line.startsWith("want") && !filterCapabilityAdded) {
			line = line.slice(0, Math.max(0, line.length - 1)) + " filter\n"
			filterCapabilityAdded = true
		}

		// insert the filter blon:none before the deepen since or the deepen not if both not exist before the flush...
		// see: https://git-scm.com/docs/git-rev-list#Documentation/git-rev-list.txt---filterltfilter-specgt
		if (
			!filterAdded &&
			(line.startsWith("deepen-since") || line.startsWith("deepen-not") || line === flushLine)
		) {
			updatedLines.push("filter blob:none\n")
			filterAdded = true
		}

		updatedLines.push(line)
	}

	return updatedLines
}

/**
 * Helper method taking lines about to be sent to git-upload-pack and replaceses the haves part with the overrides provided
 * NOTE: this method was used to fetch only a subset of oids by building by substracting the them from all oids from the repo
 *  now that we foud out about "allow-tip-sha1-in-want allow-reachable-sha1-in-want " capabilites we no longer use this
 * @param lines
 * @param oids
 * @returns
 */
export function overrideHaves(lines: string[], oids: string[]) {
	// flush line is the only line with an empty string
	const linesWithoutHaves = []
	const flushLine = ""

	// delete existing haves
	for (const line of lines) {
		if (!line.startsWith("have ")) {
			linesWithoutHaves.push(line)
		}
	}

	const updatedLines = []
	for (const line of linesWithoutHaves) {
		updatedLines.push(line)
		if (line === flushLine) {
			for (const oid of oids) {
				updatedLines.push("have " + oid + "\n")
			}
		}
	}
	return updatedLines
}

/**
 * This helper function checks the git folder for the existance of a blob. May it be within a pack file or as loose object.
 * It returns true if the blob can be found and false if not.
 *
 * @param fs the filesystem that has access to the repository. MUST not be an intercepted filesystem since this would lead to recruision // TODO #1459 we may want to check this at runtime / compiletime
 * @param oid the hash of the content of a file or a file we want to check if it exists locally // TODO #1459 think about folders here
 * @param gitdir the dire to look for blobs in
 * @returns
 */
export async function blobExistsLocaly({
	fs,
	oid,
	gitdir,
}: {
	fs: NodeishFilesystem
	oid: string
	gitdir: string
}) {
	try {
		// TODO: if we touch this again, maybe move to just checking pack file index to avoid overhead reading the object
		await readObject({
			// fs must not be intercepted - we don't want to intercept calls of read Object  // TODO #1459 can we check this by type checking or an added flag property for better dx?
			fs,
			oid,
			gitdir,
			// NOTE: we use deflated to stop early in _readObject no hashing etc is happening for format deflated
			format: "deflated",
		})

		// read object will fail with a thrown error if it can't find an object with the fiven oid...
		return true
	} catch (err) {
		// we only expect "Error NO ENTry" or iso-gits NotFoundError - rethrow on others
		if ((err as any).code !== "ENOENT" && (err as any).code !== "NotFoundError") {
			throw err
		}
	}
	return false
}

/**
 * Takes a line and addes the line lenght as 4 digit fixed hex value at the beginning…
 *
 * @param line a line raw used in a git-upload-pack request like: "want d7e62aef79d771d1771cb44c9e01faa4b7a607fe multi_ack_detailed no-done side-band-64k ofs-delta agent=git/isomorphic-git@1.24.5 filter"
 * @returns the line enriched with the amount of characters hex encoded in the first 4 characters:
 * "want d7e62aef79d771d1771cb44c9e01faa4b7a607fe multi_ack_detailed no-done side-band-64k ofs-delta agent=git/isomorphic-git@1.24.5 filter\n"
 * becomes
 * "008cwant d7e62aef79d771d1771cb44c9e01faa4b7a607fe multi_ack_detailed no-done side-band-64k ofs-delta agent=git/isomorphic-git@1.24.5 filter\n"
 *
 * this is because the prefixed hex 008c -> dec 140 and the leght of the line is 136 + 4 length characters. The only line that doesn't take the
 * length characters into account is the flush line. this is signalled by 0000
 */
export function encodePackLine(line: string) {
	const flushLine = ""

	if (line === flushLine) {
		// flush lines don't take the padded hex into account length = 0 (ignoring the leading 0000)
		const paddedHex = padHex(4, 0)

		return paddedHex
	}

	// normal lines are composed of 4 chars for the line length + length of the line
	const length = line.length + 4
	const hexLength = padHex(4, length)
	const lineWithLength = hexLength + line
	return lineWithLength
}

/***
 *
 * Takes the buffer from a git-upload-pack request and creates an array of line objects
 *
 * 008cwant d7e62aef79d771d1771cb44c9e01faa4b7a607fe multi_ack_detailed no-done side-band-64k ofs-delta agent=git/isomorphic-git@1.24.5 filter
 * 000ddeepen 1
 * 0015filter blob:none
 * 00000009done
 *
 * will result in:
 *
 * [
 *  "want d7e62aef79d771d1771cb44c9e01faa4b7a607fe multi_ack_detailed no-done side-band-64k ofs-delta agent=git/isomorphic-git@1.24.5 filter\n",
 *  "deepen 1\n",
 *  "", // empty string represents a flush
 *  "filter blob:none\n"
 *  "done\n"
 * ]
 */
export function decodeGitPackLines(concatenatedUint8Array: Uint8Array) {
	const strings: string[] = []
	let offset = 0

	while (offset + 4 < concatenatedUint8Array.length) {
		// Extract the hexadecimal length from the Uint8Array
		const hexLength = new TextDecoder().decode(concatenatedUint8Array.subarray(offset, offset + 4))

		// Parse the hexadecimal length to an integer
		const packLineLength = parseInt(hexLength, 16)

		if (packLineLength === 0) {
			// flush
			strings.push("")
			offset += 4
		} else if (packLineLength === 1) {
			throw new Error("decodeGitPackLines does not support delimiter yet")
		} else {
			// not a flush
			// Extract the string data based on the calculated length
			const contentStart = offset + 4
			const stringData = new TextDecoder().decode(
				concatenatedUint8Array.subarray(contentStart, offset + packLineLength)
			)
			offset += packLineLength
			strings.push(stringData)
		}
	}
	// Add the string to the array
	// Move the offset to the next potential string

	return strings
}
