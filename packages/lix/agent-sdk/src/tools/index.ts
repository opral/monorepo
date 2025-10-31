import type { Lix } from "@lix-js/sdk";
import { createReadFileTool } from "./read-file.js";
import { createListFilesTool } from "./list-files.js";
import { createSqlSelectTool } from "./sql-select.js";
import { createSqlIntrospectSchemaTool } from "./sql-introspect-schema.js";
import { createWriteFileTool } from "./write-file.js";
import { createDeleteFileTool } from "./delete-file.js";

export function createAgentToolSet(args: { lix: Lix }) {
	const { lix } = args;
	return {
		read_file: createReadFileTool({ lix }),
		list_files: createListFilesTool({ lix }),
		sql_select: createSqlSelectTool({ lix }),
		sql_introspect_schema: createSqlIntrospectSchemaTool({ lix }),
		write_file: createWriteFileTool({ lix }),
		delete_file: createDeleteFileTool({ lix }),
	} as const;
}

export type AgentToolSet = ReturnType<typeof createAgentToolSet>;
