import { Message, Variant } from "../versionedInterfaces.js"

const fileExtension = ".json"

export function getMessageIdFromPath(path: string) {
	if (!path.endsWith(fileExtension)) {
		return
	}

	const cleanedPath = path.replace(/\/$/, "") // This regex matches a trailing slash and replaces it with an empty string
	const messageFileName = cleanedPath.split("/").join("_") // we split by the first leading namespace or _ separator - make sure slashes don't exit in the id
	// const messageFileName = pathParts.at(-1)!

	const lastDotIndex = messageFileName.lastIndexOf(".")

	// Extract until the last dot (excluding the dot)
	return messageFileName.slice(0, Math.max(0, lastDotIndex))
}

export function getPathFromMessageId(id: string) {
	const path = id.replace("_", "/") + fileExtension
	return path
}

export function parseMessage(messagePath: string, messageRaw: string) {
	return JSON.parse(messageRaw)
}

export function encodeMessage(message: Message) {
	// create a new object do specify key output order
	const messageWithSortedKeys: any = {}
	for (const key of Object.keys(message).sort()) {
		messageWithSortedKeys[key] = (message as any)[key]
	}

	// lets order variants as well
	messageWithSortedKeys["variants"] = messageWithSortedKeys["variants"].sort(
		(variantA: Variant, variantB: Variant) => {
			// First, compare by language
			const languageComparison = variantA.languageTag.localeCompare(variantB.languageTag)

			// If languages are the same, compare by match
			if (languageComparison === 0) {
				return variantA.match.join("-").localeCompare(variantB.match.join("-"))
			}

			return languageComparison
		}
	)

	return JSON.stringify(messageWithSortedKeys, undefined, 4)
}
