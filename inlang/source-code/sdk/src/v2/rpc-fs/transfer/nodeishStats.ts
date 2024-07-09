import type { NodeishStats } from "@lix-js/fs"
import type * as Comlink from "comlink"

type Serialized = Omit<NodeishStats, "isFile" | "isDirectory" | "isSymbolicLink"> & {
	isFile: boolean
	isDirectory: boolean
	isSymbolicLink: boolean
}

const nodeishStatsTransferHandler: Comlink.TransferHandler<NodeishStats, Serialized> = {
	canHandle(value): value is NodeishStats {
		return (
			!!value &&
			typeof value === "object" &&
			"isFile" in value &&
			"isDirectory" in value &&
			"isSymbolicLink" in value
		)
	},

	serialize(value) {
		const serialized: Serialized = {
			...value,
			isFile: value.isFile(),
			isDirectory: value.isDirectory(),
			isSymbolicLink: value.isSymbolicLink(),
		}
		return [serialized, []]
	},

	deserialize(serialized) {
		const nodeishStats: NodeishStats = {
			...(serialized as unknown as NodeishStats),
			isFile: () => serialized.isFile,
			isDirectory: () => serialized.isDirectory,
			isSymbolicLink: () => serialized.isSymbolicLink,
		}
		return nodeishStats
	},
}

export { nodeishStatsTransferHandler }
