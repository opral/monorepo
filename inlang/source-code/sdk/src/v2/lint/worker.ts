import type { NodeishFilesystemSubset } from "@inlang/plugin"
import * as Comlink from "comlink"
import { createImport } from "./import.js"
import { endpoint } from "comlink-node/worker"
import type { ProjectSettings } from "@inlang/project-settings"
import createSlotStorage from "../../persistence/slotfiles/createSlotStorage.js"
import type { MessageBundle } from "../types.js"
import type { NodeishFilesystem } from "@lix-js/fs"
import type { MessageLintReport, MessageLintRule } from "@inlang/message-lint-rule"

export async function createLinter(
	projectPath: string,
	lintRules: string[],
	fs: Pick<NodeishFilesystemSubset, "readFile">
) {
	console.info(lintRules)
	const _import = createImport(projectPath, fs)

	const resolvedLintRules: MessageLintRule[] = await Promise.all(
		lintRules.map(async (uri) => {
			const module = await _import(uri)
			return module.default as MessageLintRule
		})
	)

	const fullFs = new Proxy(fs as NodeishFilesystem, {
		get(target, prop) {
			if (prop in target) {
				return target[prop]
			} else {
				throw new Error("nope")
			}
		},
	})

	const messageSlotStorage = createSlotStorage<MessageBundle>("message", 12, 12)
	await messageSlotStorage.connect(fullFs, projectPath)

	return {
		lint: async (settings: ProjectSettings): Promise<MessageLintReport[]> => {
			// read from slot-storage
			const messageBundles = await messageSlotStorage.readAll()
		},
	}
}

Comlink.expose(createLinter, endpoint)
