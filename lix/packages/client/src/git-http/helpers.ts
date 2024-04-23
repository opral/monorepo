function padHex(pad: number, n: number) {
	const s = n.toString(16)
	return "0".repeat(pad - s.length) + s
}

/**
 * Takes a line and addes the line lenght as 4 digit fixed hex value at the beginning…
 * test
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

	return strings
}
