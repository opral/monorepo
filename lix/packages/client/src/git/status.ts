import { statusList as lixStatusList } from "./status-list.js"
import type { RepoContext, RepoState } from "../openRepository.js"

export async function status(ctx: RepoContext, state: RepoState, filepath: string) {
	if (typeof filepath !== "string") {
		throw new Error("parameter must be a string")
	}
	const statusList = await lixStatusList(ctx, state, {
		filepaths: [filepath],
	})

	const maybeStatusEntry: [string, string] = statusList[0] || [filepath, "unknown"]
	return maybeStatusEntry?.[1] as string
}
