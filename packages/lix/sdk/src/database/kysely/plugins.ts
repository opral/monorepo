import { ParseJSONResultsPlugin, type KyselyPlugin } from "kysely";
import { JSONColumnPlugin } from "../kysely-plugin/json-column-plugin.js";
import { ViewInsertReturningErrorPlugin } from "../kysely-plugin/view-insert-returning-error-plugin.js";
import { LixSchemaViewMap } from "../schema.js";
import { buildJsonColumnConfig } from "../../lix/json-column-config.js";

export function createDefaultPlugins(): KyselyPlugin[] {
	const jsonColumnsConfig = buildJsonColumnConfig({ includeChangeView: true });
	const viewNames = Object.keys(LixSchemaViewMap);

	return [
		new ParseJSONResultsPlugin(),
		JSONColumnPlugin(jsonColumnsConfig),
		new ViewInsertReturningErrorPlugin(viewNames),
	];
}
