import type { Lix } from "@lix-js/sdk";
import { createReadFileTool } from "./read-file.js";
import { createListFilesTool } from "./list-files.js";
import { createSqlSelectStateTool } from "./sql-select-state.js";
import { createWriteFileTool } from "./write-file.js";
import { createDeleteFileTool } from "./delete-file.js";
import { createCreateVersionTool } from "./create-version.js";
import { createCreateChangeProposalTool } from "./create-change-proposal.js";

export function createAgentToolSet(args: { lix: Lix }) {
	const { lix } = args;
	return {
		read_file: createReadFileTool({ lix }),
		list_files: createListFilesTool({ lix }),
		sql_select_state: createSqlSelectStateTool({ lix }),
		write_file: createWriteFileTool({ lix }),
		delete_file: createDeleteFileTool({ lix }),
		create_version: createCreateVersionTool({ lix }),
		create_change_proposal: createCreateChangeProposalTool({ lix }),
	} as const;
}

export type AgentToolSet = ReturnType<typeof createAgentToolSet>;
