import {
	SelectQueryNode,
	CompiledQuery,
	type KyselyPlugin,
	type PluginTransformQueryArgs,
} from "kysely";

type QueryId = PluginTransformQueryArgs["queryId"];

export function SyncPlugin(): KyselyPlugin {
	const selectQueries = new WeakMap<QueryId, SelectQueryNode>();

	return {
		async transformResult({ queryId, result }) {
			if (selectQueries.has(queryId) === false) {
				return result;
			}
			let remoteResult;
			try {
				remoteResult = await executeRemoteQuery(
					"http://localhost:3000",
					CompiledQuery.raw(`SELECT * FROM change;`),
				);
			} catch {
				return result;
			}
			return remoteResult;
		},
		transformQuery({ queryId, node }) {
			if (node.kind === "SelectQueryNode") {
				selectQueries.set(queryId, node);
			}
			return node;
		},
	};
}

async function executeRemoteQuery(
	serverUrl: string,
	compiledQuery: CompiledQuery,
) {
	const { sql, parameters } = compiledQuery;

	const response = await fetch(`${serverUrl}/lsp/lix/{mock-lix-id}/query`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ sql, parameters }),
	});

	if (!response.ok) {
		console.error("Error executing remote query:", await response.text());
		throw new Error("Failed to execute query against server.");
	}

	return response.json();
}
