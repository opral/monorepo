export type SerializedMessage = {
	id: string
	text: string
} & MessageMetadata

export type MessageMetadata = {
	parentKeys?: string[]
	fileName?: string
	keyName?: string
}
