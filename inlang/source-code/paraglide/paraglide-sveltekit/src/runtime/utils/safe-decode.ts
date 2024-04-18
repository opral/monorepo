export function safeDecode(maybeEncoded: string): string {
	try {
		return decodeURI(maybeEncoded)
	} catch {
		return maybeEncoded
	}
}
