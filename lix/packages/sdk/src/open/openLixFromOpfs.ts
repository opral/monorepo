import { SQLocalKysely } from "sqlocal/kysely"
import { setup } from "./setup.js"
import { Kysely, ParseJSONResultsPlugin } from "kysely"
import type { LixDatabase } from "../schema.js"
import { commit } from "../commit.js"

/**
 * @deprecated use in memory instead (just exist to unblock nils with settings component)
 */
export async function openLixFromOpfs(args: { path: string }) {
	const { getDatabaseContent, dialect } = new SQLocalKysely({
		storage: {
			type: "opfs",
			path: args.path,
		},
	})
	const db = new Kysely<LixDatabase>({
		dialect,
		plugins: [new ParseJSONResultsPlugin()],
	})
	return {
		db,
		toBlob: async () => new Blob([await getDatabaseContent()]),
		commit: (args: { userId: string; description: string }) => {
			return commit({ db, ...args })
		},
	}
}
