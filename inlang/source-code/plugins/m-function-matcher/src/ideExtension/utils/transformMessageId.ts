export default function transformMessageId(messageId: string): string {
	return messageId
		.trim()
		.replace(/[^a-zA-Z0-9\s_.]/g, "")
		.replace(/[\s.]+/g, "_")
}
