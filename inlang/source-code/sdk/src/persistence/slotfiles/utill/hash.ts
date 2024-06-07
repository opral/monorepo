export let nodeCrypto: any = undefined

if (typeof crypto === "undefined" && typeof process !== "undefined" && process?.versions?.node) {
	nodeCrypto = await import("node:crypto")
}
/**
 * sync env independet implementation of  sha-256 hash function
 * @param inputStr string to create a hash for
 * @returns a 20 byte hex based hash created using sha-256
 */

export function hash(inputStr: string) {
	// @ts-ignore
	if (
		typeof nodeCrypto !== "undefined" &&
		typeof process !== "undefined" &&
		process?.versions?.node
	) {
		const hash = nodeCrypto.createHash("sha256", "")
		hash.update(inputStr)
		// @ts-ignore
		return hash.digest("hex")
	} else if (typeof crypto !== "undefined") {
		const utf8 = new TextEncoder().encode(inputStr)
		return crypto.subtle.digest("SHA-256", utf8).then((hashBuffer) => {
			const hashArray = [...new Uint8Array(hashBuffer)]
			const hashHex = hashArray.map((bytes) => bytes.toString(16).padStart(2, "0")).join("")
			return hashHex
		})
	}

	throw new Error("Could not find crypto features in runtime")
}
