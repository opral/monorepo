import { Message } from "../versionedInterfaces.js"

const fileExtension = ".json"

export function getMessageIdFromPath(path: string) {
	if (!path.endsWith(fileExtension)) {
		return
	}

	const cleanedPath = path.replace(/\/$/, "") // This regex matches a trailing slash and replaces it with an empty string
	const messageFileName = cleanedPath // .split("/").join("_")
	// const messageFileName = pathParts.at(-1)!

	const lastDotIndex = messageFileName.lastIndexOf(".")

	// Extract until the last dot (excluding the dot)
	return messageFileName.slice(0, Math.max(0, lastDotIndex))
}

export function getPathFromMessageId(id: string) {
	return id + fileExtension
}

export function parseMessage(messagePath: string, messageRaw: string) {
	return JSON.parse(messageRaw)
}

export function encodeMessage(message: Message) {
	return JSON.stringify(message, undefined, 4)
}
