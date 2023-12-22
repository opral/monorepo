export async function hash(inputStr: string) {
	let usedCrypto
	// @ts-ignore
	if (typeof crypto === "undefined" && typeof process !== "undefined" && process?.versions?.node) {
		// @ts-ignore
		usedCrypto = await import("node:crypto")
	} else if (typeof crypto !== "undefined") {
		usedCrypto = crypto
	}
	if (!usedCrypto) {
		throw new Error("Could not find crypto features in runtime")
	}

	const idDigest = await usedCrypto.subtle.digest("SHA-256", new TextEncoder().encode(inputStr))
	return [...new Uint8Array(idDigest)].map((b) => ("00" + b.toString(16)).slice(-2)).join("")
}
