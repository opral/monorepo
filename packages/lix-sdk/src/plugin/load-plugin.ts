import type { LixDatabaseSchema } from "../database/schema.js";
import type { LixFile } from "../file/database-schema.js";
import type { LixPlugin } from "./lix-plugin.js";
import { Kysely, sql } from "kysely";

export async function loadPlugins(
	db: Kysely<LixDatabaseSchema>
): Promise<LixPlugin[]> {
	// https://github.com/opral/inlang-paraglide-js/issues/350

	// this function need an overhaul. text @samuelstroschein before you implement stuff.
	// - needs manifest file, not match by "plugin/*" to avoid accidental loading of non-plugins

	throw new Error("not implemented");
	// @ts-expect-error - currently disabled
	const pluginFiles = (
		await sql`
    SELECT * FROM file
    WHERE path GLOB 'lix/plugin/*'
  `.execute(db)
	).rows as unknown as LixFile[];

	const decoder = new TextDecoder("utf8");
	const plugins: LixPlugin[] = [];
	for (const plugin of pluginFiles) {
		const blob = new Blob([decoder.decode(plugin.data)], {
			type: "text/javascript",
		});
		const blobUrl = URL.createObjectURL(blob);
		const pluginModule = await import(/* @vite-ignore */ blobUrl);

		plugins.push(pluginModule.default);
		if (pluginModule.default.setup) {
			await pluginModule.default.setup();
		}
	}
	return plugins as LixPlugin[];
}
