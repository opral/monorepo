export async function hash(inputStr: string) {
	if (!globalThis?.crypto) {
		throw new Error("Could not find crypto features in runtime")
	}

	const idDigest = await globalThis.crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(inputStr)
	)
	return [...new Uint8Array(idDigest)].map((b) => ("00" + b.toString(16)).slice(-2)).join("")
}
