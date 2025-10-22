import { expect, test } from "vitest";
import { internalQueryBuilder } from "../internal-query-builder.js";
import { preprocessRootOperationNode } from "./preprocess-root-operation-node.js";
import { openLix } from "../../lix/index.js";
import { type RootOperationNode } from "kysely";
import { compile } from "./compile.js";

test("accepts internal state vtable queries", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const query = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable")
		.selectAll("lix_internal_state_vtable");

	const node = query.toOperationNode() as RootOperationNode;

	const compiled = compile(preprocessRootOperationNode(node));

	const result = lix.engine?.sqlite.exec({
		sql: compiled.sql,
		bind: compiled.parameters as any[],
		returnValue: "resultRows",
		rowMode: "object",
	});

	expect(result).toBeDefined();
});
