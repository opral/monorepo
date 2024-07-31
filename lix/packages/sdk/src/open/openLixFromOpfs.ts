import { SQLocalKysely } from "sqlocal/kysely"
import { setup } from "./setup.js"

/**
 *
 */
export async function openLixFromOpfs(args: { path: string }) {
	const sqlocal = new SQLocalKysely({
		storage: {
			type: "opfs",
			path: args.path,
		},
	})
	return setup({ sqlocal })
}
