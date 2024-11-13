import type { LixDatabaseSchema, LixFile } from "../database/schema.js";
import type { LixPlugin } from "./lix-plugin.js";
import { Kysely, sql } from "kysely";

export async function loadPlugins(
	db: Kysely<LixDatabaseSchema>,
): Promise<LixPlugin[]> {
	const pluginFiles = (
		await sql`
    SELECT * FROM file
    WHERE path GLOB 'lix/plugin/*'
  `.execute(db)
	).rows as unknown as LixFile[];

	const decoder = new TextDecoder("utf8");
	const plugins: LixPlugin[] = [];
	for (const plugin of pluginFiles) {
		const text = btoa(decoder.decode(plugin.data));
		const pluginModule = await import(
			/* @vite-ignore */ "data:text/javascript;base64," + text
		);
		plugins.push(pluginModule.default);
		if (pluginModule.default.setup) {
			await pluginModule.default.setup();
		}
	}
	return plugins as LixPlugin[];
}
