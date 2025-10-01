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
	SELECT,
	type Token,
} from "../tokenizer.js";
import { findTableFactors, type TableFactorMatch } from "./table-factor.js";

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
	selectsWriterKey: boolean;
	referencesPrimaryKey: boolean;
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

type SelectContext = {
	startIndex: number;
	endIndex: number;
	depth: number;
};

export function analyzeShape(tokens: Token[]): Shape | null {
	const shapes = analyzeShapes(tokens);
	return shapes[0] ?? null;
}

/**
 * Derives rewrite metadata for every `internal_state_vtable` reference inside the token stream.
 *
 * @example
 * ```ts
 * const tokens = tokenize("SELECT * FROM internal_state_vtable v WHERE v.schema_key = 'example'");
 * const [shape] = analyzeShapes(tokens);
 * console.log(shape.table.alias); // "v"
 * ```
 */
export function analyzeShapes(tokens: Token[]): Shape[] {
	const { contexts, indexToContext } = computeSelectContexts(tokens);
	if (contexts.length === 0) {
		return [];
	}

	const matches = findTableFactors(tokens, "internal_state_vtable");
	if (matches.length === 0) {
		return [];
	}

	const shapes: Shape[] = [];
	for (const match of matches) {
		const context = indexToContext[match.tokenIndex];
		if (!context) continue;
		const shape = analyzeShapeInternal(
			tokens,
			match,
			context.startIndex,
			context.endIndex
		);
		if (shape) {
			shapes.push(shape);
		}
	}

	return shapes;
}

function analyzeShapeInternal(
	tokens: Token[],
	table: TableFactorMatch,
	rangeStart: number,
	rangeEnd: number
): Shape | null {
	const filters: Filter[] = [];
	const lowerAlias = table.alias.toLowerCase();
	const allowedAliases = new Set<string>([lowerAlias]);
	if (!table.explicitAlias) {
		allowedAliases.add("internal_state_vtable");
	}

	let referencesPrimaryKey = false;

	for (let i = rangeStart; i <= rangeEnd; i++) {
		const token = tokens[i];
		if (!token) continue;

		// match qualified alias.column
		let alias: string | undefined;
		let columnToken: Token | undefined;

		if (
			isIdent(token) &&
			i + 2 <= rangeEnd &&
			tokens[i + 1]?.tokenType === Dot &&
			isIdent(tokens[i + 2])
		) {
			alias = normalize(token.image);
			if (!allowedAliases.has(alias)) {
				continue;
			}
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
		if (columnName === "_pk") {
			referencesPrimaryKey = true;
		}
		if (!isSchemaColumn(columnName)) continue;

		const result = parseFilter(tokens, i, alias, columnName, rangeEnd);
		if (!result) {
			continue;
		}

		filters.push(result.filter);
		i = Math.min(result.nextIndex, rangeEnd);
	}

	const limit = readLimit(tokens, rangeStart, rangeEnd);
	const schemaKeys = pluckValues(filters, "schema_key");
	const entityIds = pluckValues(filters, "entity_id");
	const versionId = determineVersionId(filters);
	const selectsWriterKey = tokens
		.slice(rangeStart, rangeEnd + 1)
		.some((token) => isIdent(token) && normalize(token.image) === "writer_key");

	return {
		table,
		filters,
		limit,
		schemaKeys,
		entityIds,
		versionId,
		selectsWriterKey,
		referencesPrimaryKey,
	};
}

function parseFilter(
	tokens: Token[],
	index: number,
	alias: string | undefined,
	column: string,
	rangeEnd: number
): { filter: Filter; nextIndex: number } | null {
	let cursor = index + (alias ? 3 : 1); // skip alias, dot, column if qualified

	const opToken = tokens[cursor];
	if (!opToken) return null;

	const opImage = opToken.image.toUpperCase();
	if (opImage !== "=" && opImage !== "IN") return null;

	cursor += 1;

	if (opImage === "IN") {
		const rhs = parseInList(tokens, cursor, rangeEnd);
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

	if (cursor > rangeEnd) {
		return null;
	}

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
	index: number,
	rangeEnd: number
): { value: { kind: "list"; values: Value[] }; nextIndex: number } | null {
	let cursor = index;
	if (tokens[cursor]?.image !== "(") return null;
	cursor += 1;

	const values: Value[] = [];

	while (cursor <= rangeEnd && tokens[cursor]?.image !== ")") {
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

	if (cursor > rangeEnd || tokens[cursor]?.image !== ")") return null;

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

function readLimit(
	tokens: Token[],
	rangeStart: number,
	rangeEnd: number
): Limit {
	for (let i = rangeStart; i <= rangeEnd - 1; i++) {
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

function determineVersionId(filters: Filter[]): Shape["versionId"] {
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

function computeSelectContexts(tokens: Token[]): {
	contexts: SelectContext[];
	indexToContext: Array<SelectContext | undefined>;
} {
	const contexts: SelectContext[] = [];
	const indexToContext: Array<SelectContext | undefined> = new Array(
		tokens.length
	);
	const stack: SelectContext[] = [];
	const depthBefore = computeDepthBefore(tokens);
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (!token) {
			indexToContext[i] = stack[stack.length - 1];
			continue;
		}

		if (token.image === ")") {
			const afterDepth = depthBefore[i] - 1;
			while (stack.length && stack[stack.length - 1].depth > afterDepth) {
				const popped = stack.pop()!;
				popped.endIndex = Math.max(i - 1, popped.startIndex);
			}
		}

		if (token.tokenType === SELECT) {
			const depth = depthBefore[i];
			while (stack.length && stack[stack.length - 1].depth === depth) {
				const previous = stack.pop()!;
				previous.endIndex = Math.max(i - 1, previous.startIndex);
			}
			const context: SelectContext = {
				startIndex: i,
				endIndex: tokens.length - 1,
				depth,
			};
			stack.push(context);
			contexts.push(context);
		}

		indexToContext[i] = stack[stack.length - 1];
	}

	while (stack.length) {
		const popped = stack.pop()!;
		if (popped.endIndex < popped.startIndex) {
			popped.endIndex = tokens.length - 1;
		}
	}

	return { contexts, indexToContext };
}

function computeDepthBefore(tokens: Token[]): number[] {
	const depths = new Array<number>(tokens.length).fill(0);
	let depth = 0;
	for (let i = 0; i < tokens.length; i++) {
		depths[i] = depth;
		const token = tokens[i];
		if (!token) continue;
		if (token.image === "(") {
			depth += 1;
			continue;
		}
		if (token.image === ")") {
			depth = Math.max(0, depth - 1);
		}
	}
	return depths;
}
