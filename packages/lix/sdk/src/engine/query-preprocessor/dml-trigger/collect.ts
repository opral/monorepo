import type { LixEngine } from "../../boot.js";
import {
	DELETE,
	INSERT,
	UPDATE,
	tokenize,
	type Token,
} from "../../sql-parser/tokenizer.js";

export type DmlTriggerOperation = "insert" | "update" | "delete";

export interface DmlTriggerDefinition {
	readonly name: string;
	readonly target: string;
	readonly operation: DmlTriggerOperation;
	readonly rawSql: string;
	readonly bodySql: string;
}

/**
 * Collect all INSTEAD OF triggers defined in the current SQLite schema.
 *
 * @example
 * ```ts
 * const triggers = collectDmlTriggers({ sqlite: engine.sqlite });
 * console.log(triggers.map((trigger) => trigger.target));
 * ```
 */
export function collectDmlTriggers({
	sqlite,
}: Pick<LixEngine, "sqlite">): DmlTriggerDefinition[] {
	const result = sqlite.exec({
		sql: "SELECT name, tbl_name AS target, sql FROM sqlite_schema WHERE type = 'trigger' AND sql IS NOT NULL",
		returnValue: "resultRows",
		rowMode: "object",
		columnNames: [],
	});

	const rows = result as Array<Record<string, unknown>>;
	const triggers: DmlTriggerDefinition[] = [];

	for (const row of rows) {
		const name = typeof row.name === "string" ? row.name : null;
		const target = typeof row.target === "string" ? row.target : null;
		const rawSql = typeof row.sql === "string" ? row.sql : null;
		if (!name || !target || !rawSql) {
			continue;
		}

		const tokens = tokenize(rawSql);
		const operation = parseOperation(tokens);
		if (!operation) {
			continue;
		}

		const bodySql = extractTriggerBody(rawSql, tokens);
		triggers.push({ name, target, operation, rawSql, bodySql });
	}

	return triggers;
}

function parseOperation(tokens: Token[]): DmlTriggerOperation | null {
	let insteadIndex = -1;
	for (let i = 0; i < tokens.length; i++) {
		const text = tokens[i]?.image?.toUpperCase();
		if (text === "INSTEAD") {
			insteadIndex = i;
			break;
		}
	}
	if (insteadIndex === -1) {
		return null;
	}

	let ofIndex = -1;
	for (let i = insteadIndex + 1; i < tokens.length; i++) {
		const text = tokens[i]?.image?.toUpperCase();
		if (text === "OF") {
			ofIndex = i;
			break;
		}
	}
	if (ofIndex === -1) {
		return null;
	}

	for (let i = ofIndex + 1; i < tokens.length; i++) {
		const token = tokens[i];
		if (!token) continue;
		const type = token.tokenType;
		if (type === INSERT) return "insert";
		if (type === UPDATE) return "update";
		if (type === DELETE) return "delete";
	}

	return null;
}

function extractTriggerBody(sql: string, tokens: Token[]): string {
	let beginToken: Token | undefined;
	for (const token of tokens) {
		if (token.image?.toUpperCase() === "BEGIN") {
			beginToken = token;
			break;
		}
	}
	if (!beginToken) {
		return "";
	}

	let endToken: Token | undefined;
	for (let i = tokens.length - 1; i >= 0; i--) {
		const token = tokens[i];
		if (token?.image?.toUpperCase() === "END") {
			endToken = token;
			break;
		}
	}

	const startOffset =
		(beginToken.endOffset ?? beginToken.startOffset ?? -1) + 1;
	const endOffset = endToken?.startOffset ?? sql.length;
	if (startOffset >= endOffset) {
		return "";
	}

	return sql.slice(startOffset, endOffset).trim();
}
