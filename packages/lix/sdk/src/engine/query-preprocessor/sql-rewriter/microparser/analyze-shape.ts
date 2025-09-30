import {
	AS,
	AtName,
	ColonName,
	DollarName,
	DollarNumber,
	Dot,
	Ident,
	LIMIT,
	Num,
	QIdent,
	QMark,
	SQStr,
	type Token,
} from "../tokenizer.js";
import { findTableFactor, type TableFactorMatch } from "./table-factor.js";

export type PlaceholderToken = Token;

export type ValueLit =
	| { kind: "string"; value: string; token: Token }
	| { kind: "number"; value: number; token: Token };

export type Value = ValueLit | { kind: "placeholder"; token: PlaceholderToken };

export type ColumnRef = {
	alias?: string;
	column: string;
	startIx: number;
	endIx: number;
};

export type Filter = {
	lhs: ColumnRef;
	op: string;
	rhs: Value | { kind: "list"; values: Value[] } | null;
};

export type Limit =
	| { kind: "number"; value: number; token: Token }
	| { kind: "placeholder"; token: PlaceholderToken }
	| { kind: "none" };

export type Shape = {
	table: TableFactorMatch;
	filters: Filter[];
	limit: Limit;
	schemaKeys: Array<
		{ kind: "literal"; value: string } | { kind: "placeholder" }
	>;
	entityIds: Array<
		{ kind: "literal"; value: string } | { kind: "placeholder" }
	>;
	versionId:
		| { kind: "current" }
		| { kind: "literal"; value: string }
		| { kind: "placeholder"; token: PlaceholderToken }
		| { kind: "unknown" };
};

const placeholderTypes = new Set([
	QMark,
	ColonName,
	DollarName,
	DollarNumber,
	AtName,
]);

const isIdent = (token: Token | undefined): token is Token =>
	!!token && (token.tokenType === Ident || token.tokenType === QIdent);

const dequote = (image: string): string =>
	image.startsWith('"') && image.endsWith('"')
		? image.slice(1, -1).replace(/""/g, "")
		: image;

const normalize = (image: string): string => dequote(image).toLowerCase();

const unquoteString = (image: string): string =>
	image.slice(1, -1).replace(/''/g, "'");

const isSchemaColumn = (name: string) =>
	name === "schema_key" || name === "entity_id" || name === "version_id";

export function analyzeShape(tokens: Token[]): Shape | null {
	const table = findTableFactor(tokens, "internal_state_vtable");
	if (!table) return null;

	const filters: Filter[] = [];

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];

		// match qualified alias.column
		let alias: string | undefined;
		let columnToken: Token | undefined;

		if (
			isIdent(token) &&
			tokens[i + 1]?.tokenType === Dot &&
			isIdent(tokens[i + 2])
		) {
			alias = dequote(token.image);
			columnToken = tokens[i + 2];
		} else if (isIdent(token)) {
			columnToken = token;
		} else {
			continue;
		}

		if (!columnToken) {
			continue;
		}

		const columnName = normalize(columnToken.image);
		if (!isSchemaColumn(columnName)) continue;

		const result = parseFilter(tokens, i, alias, columnName);
		if (!result) {
			continue;
		}

		filters.push(result.filter);
		i = result.nextIndex;
	}

	const limit = readLimit(tokens);
	const schemaKeys = pluckValues(filters, "schema_key");
	const entityIds = pluckValues(filters, "entity_id");
	const versionId = determineVersionId(filters, tokens);

	return {
		table,
		filters,
		limit,
		schemaKeys,
		entityIds,
		versionId,
	};
}

function parseFilter(
	tokens: Token[],
	index: number,
	alias: string | undefined,
	column: string
): { filter: Filter; nextIndex: number } | null {
	let cursor = index + (alias ? 3 : 1); // skip alias, dot, column if qualified

	const opToken = tokens[cursor];
	if (!opToken) return null;

	const opImage = opToken.image.toUpperCase();
	if (opImage !== "=" && opImage !== "IN") return null;

	cursor += 1;

	if (opImage === "IN") {
		const rhs = parseInList(tokens, cursor);
		if (!rhs) return null;

		return {
			filter: {
				lhs: { alias, column, startIx: index, endIx: rhs.nextIndex },
				op: opImage,
				rhs: rhs.value,
			},
			nextIndex: rhs.nextIndex,
		};
	}

	const valueToken = tokens[cursor];
	if (!valueToken) return null;

	const rhs = toValue(valueToken);
	if (!rhs) return null;

	return {
		filter: {
			lhs: { alias, column, startIx: index, endIx: cursor },
			op: opImage,
			rhs,
		},
		nextIndex: cursor,
	};
}

function parseInList(
	tokens: Token[],
	index: number
): { value: { kind: "list"; values: Value[] }; nextIndex: number } | null {
	let cursor = index;
	if (tokens[cursor]?.image !== "(") return null;
	cursor += 1;

	const values: Value[] = [];

	while (cursor < tokens.length && tokens[cursor]?.image !== ")") {
		const token = tokens[cursor];
		if (!token) break;

		const value = toValue(token);
		if (!value) return null;
		values.push(value);

		cursor += 1;
		if (tokens[cursor]?.image === ",") {
			cursor += 1;
		}
	}

	if (cursor >= tokens.length || tokens[cursor]?.image !== ")") return null;

	const listValue: { kind: "list"; values: Value[] } = { kind: "list", values };
	return { value: listValue, nextIndex: cursor };
}

function toValue(token: Token): Value | null {
	if (token.tokenType === SQStr) {
		return { kind: "string", value: unquoteString(token.image), token };
	}
	if (token.tokenType === Num) {
		return { kind: "number", value: Number(token.image), token };
	}
	if (placeholderTypes.has(token.tokenType)) {
		return { kind: "placeholder", token };
	}
	return null;
}

function readLimit(tokens: Token[]): Limit {
	for (let i = 0; i < tokens.length - 1; i++) {
		const current = tokens[i];
		if (!current || current.tokenType !== LIMIT) continue;
		const next = tokens[i + 1];
		if (!next) break;

		if (next.tokenType === Num) {
			const value = Number(next.image);
			if (Number.isFinite(value)) {
				return { kind: "number", value, token: next };
			}
			return { kind: "none" };
		}

		if (next.tokenType === SQStr && next.image === "'1'") {
			return { kind: "number", value: 1, token: next };
		}

		if (placeholderTypes.has(next.tokenType)) {
			return { kind: "placeholder", token: next };
		}
	}

	return { kind: "none" };
}

function pluckValues(
	filters: Filter[],
	column: "schema_key" | "entity_id"
): Array<{ kind: "literal"; value: string } | { kind: "placeholder" }> {
	const results: Array<
		{ kind: "literal"; value: string } | { kind: "placeholder" }
	> = [];

	for (const filter of filters) {
		if (filter.lhs.column !== column) continue;
		const rhs = filter.rhs;
		if (!rhs) continue;

		if (rhs.kind === "list") {
			for (const value of rhs.values) {
				if (value.kind === "string") {
					results.push({ kind: "literal", value: value.value });
				} else if (value.kind === "placeholder") {
					results.push({ kind: "placeholder" });
				}
			}
		} else if (rhs.kind === "string") {
			results.push({ kind: "literal", value: rhs.value });
		} else if (rhs.kind === "placeholder") {
			results.push({ kind: "placeholder" });
		}
	}

	return results;
}

function determineVersionId(
	filters: Filter[],
	tokens: Token[]
): Shape["versionId"] {
	const versionFilter = filters.find(
		(filter) => filter.lhs.column === "version_id"
	);
	if (!versionFilter) return { kind: "unknown" };

	const rhs = versionFilter.rhs;
	if (!rhs) return { kind: "unknown" };

	if (rhs.kind === "string") {
		return { kind: "literal", value: rhs.value };
	}

	if (rhs.kind === "placeholder") {
		return { kind: "placeholder", token: rhs.token };
	}
	return { kind: "unknown" };
}
