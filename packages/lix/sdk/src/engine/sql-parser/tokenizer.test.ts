import { expect, test } from "vitest";
import {
	tokenize,
	FROM,
	WHERE,
	LIMIT,
	ORDER,
	BY,
	GROUP,
	HAVING,
	WINDOW,
	OFFSET,
	FETCH,
	AS,
	JOIN,
	Ident,
	QIdent,
	Dot,
	SQStr,
	Num,
	QMark,
	ColonName,
	DollarName,
	DollarNumber,
	AtName,
	Minus,
	Equals,
	WITH,
	LParen,
	RParen,
	type Token,
} from "./tokenizer.js";

test("tokenizes FROM lix_internal_state_vtable with alias and LIMIT 1", () => {
	const sql = `SELECT json_extract(s.snapshot_content,'$.value.nano_id') AS nano_id
                 FROM lix_internal_state_vtable s
                 WHERE s.schema_key = 'lix_key_value'
                 AND s.snapshot_content IS NOT NULL
                 LIMIT 1`;

	const tokens = tokenize(sql);
	const iFrom = tokens.findIndex((tt) => tt.tokenType === FROM);
	expect(iFrom).toBeGreaterThanOrEqual(0);

	const tableTok = requireToken(tokens[iFrom + 1], "table ident");
	const aliasTok = requireToken(tokens[iFrom + 2], "table alias");
	expect(tableTok.tokenType).toBe(Ident);
	expect(tableTok.image).toBe("lix_internal_state_vtable");
	expect(aliasTok.tokenType).toBe(Ident);
	expect(aliasTok.image).toBe("s");

	const iWhere = tokens.findIndex((tt) => tt.tokenType === WHERE);
	expect(iWhere).toBeGreaterThanOrEqual(0);

	const whereAlias = requireToken(tokens[iWhere + 1], "where alias");
	const dotTok = requireToken(tokens[iWhere + 2], "qualified dot");
	const columnTok = requireToken(tokens[iWhere + 3], "schema_key column");
	expect(whereAlias.image).toBe("s");
	expect(dotTok.tokenType).toBe(Dot);
	expect(columnTok.image.toLowerCase()).toBe("schema_key");

	const lit = requireToken(
		tokens.find(
			(tt) => tt.tokenType === SQStr && tt.image === `'lix_key_value'`
		),
		"schema key literal"
	);
	expect(lit.image).toBe(`'lix_key_value'`);

	const iLimit = tokens.findIndex((tt) => tt.tokenType === LIMIT);
	expect(iLimit).toBeGreaterThanOrEqual(0);
	const limitValue = requireToken(tokens[iLimit + 1], "limit value");
	expect(limitValue.tokenType).toBe(Num);
	expect(limitValue.image).toBe("1");
});

test("tokenizes ORDER BY clause without turning ORDER into an identifier", () => {
	const sql = `SELECT path FROM file ORDER BY path DESC`;
	const tokens = tokenize(sql);

	const orderIx = tokens.findIndex((t) => t.tokenType === ORDER);
	const byIx = tokens.findIndex((t) => t.tokenType === BY);

	expect(orderIx).toBeGreaterThanOrEqual(0);
	expect(byIx).toBe(orderIx + 1);

	const orderColumn = requireToken(tokens[orderIx + 2], "order by column");
	expect(orderColumn.tokenType).toBe(Ident);
	expect(orderColumn.image).toBe("path");

	const identHits = tokens.filter((t) => t.tokenType === Ident);
	expect(identHits.map((t) => t.image.toLowerCase())).not.toContain("order");
});

test("tokenizes GROUP BY / HAVING with dedicated keyword tokens", () => {
	const sql = `SELECT key, COUNT(*) FROM stored_schema GROUP BY key HAVING COUNT(*) > 1`;
	const tokens = tokenize(sql);

	const groupIx = tokens.findIndex((t) => t.tokenType === GROUP);
	const byIx = tokens.findIndex((t) => t.tokenType === BY);
	const havingIx = tokens.findIndex((t) => t.tokenType === HAVING);

	expect(groupIx).toBeGreaterThanOrEqual(0);
	expect(byIx).toBe(groupIx + 1);
	expect(havingIx).toBeGreaterThan(groupIx);

	const groupedColumn = requireToken(tokens[groupIx + 2], "group by column");
	expect(groupedColumn.tokenType).toBe(Ident);
	expect(groupedColumn.image).toBe("key");

	const identImages = tokens
		.filter((t) => t.tokenType === Ident)
		.map((t) => t.image.toLowerCase());
	expect(identImages).not.toContain("group");
	expect(identImages).not.toContain("having");
});

test("tokenizes WINDOW clause and OFFSET/FETCH keywords", () => {
	const sql = `SELECT * FROM file WINDOW w AS (PARTITION BY path ORDER BY updated_at) OFFSET 10 ROWS FETCH NEXT 5 ROWS ONLY`;
	const tokens = tokenize(sql);

	const windowIx = tokens.findIndex((t) => t.tokenType === WINDOW);
	const offsetIx = tokens.findIndex((t) => t.tokenType === OFFSET);
	const fetchIx = tokens.findIndex((t) => t.tokenType === FETCH);

	expect(windowIx).toBeGreaterThanOrEqual(0);
	expect(offsetIx).toBeGreaterThan(windowIx);
	expect(fetchIx).toBeGreaterThan(offsetIx);

	const windowAlias = requireToken(tokens[windowIx + 1], "window alias");
	expect(windowAlias.tokenType).toBe(Ident);
	expect(windowAlias.image).toBe("w");

	const identImages = tokens
		.filter((t) => t.tokenType === Ident)
		.map((t) => t.image.toLowerCase());
	expect(identImages).not.toContain("window");
	expect(identImages).not.toContain("offset");
	expect(identImages).not.toContain("fetch");
});

test("handles quoted table and alias", () => {
	const sql = `SELECT * FROM "lix_internal_state_vtable" AS "S"`;
	const tok = tokenize(sql);

	const fromIx = tok.findIndex((t) => t.tokenType === FROM);
	expect(fromIx).toBeGreaterThanOrEqual(0);

	const tableTok = requireToken(tok[fromIx + 1], "quoted table");
	const asTok = requireToken(tok[fromIx + 2], "AS keyword");
	const aliasTok = requireToken(tok[fromIx + 3], "quoted alias");

	expect(tableTok.tokenType).toBe(QIdent);
	expect(tableTok.image).toBe(`"lix_internal_state_vtable"`);
	expect(asTok.tokenType).toBe(AS);
	expect(aliasTok.tokenType).toBe(QIdent);
	expect(aliasTok.image).toBe(`"S"`);

	expect(sliceBy(sql, tableTok)).toBe(`"lix_internal_state_vtable"`);
	expect(sliceBy(sql, aliasTok)).toBe(`"S"`);
});

test("does not produce identifiers from comments or strings", () => {
	const sql = `
      /* FROM lix_internal_state_vtable should be ignored */
      SELECT 'lix_internal_state_vtable in a string' AS note
      FROM lix_internal_state_vtable -- trailing comment has lix_internal_state_vtable
    `;
	const tok = tokenize(sql);

	const hits = tok.filter(
		(t) => t.tokenType === Ident && t.image === "lix_internal_state_vtable"
	);
	expect(hits.length).toBe(1);

	const str = requireToken(
		tok.find((t) => t.tokenType === SQStr),
		"string literal token"
	);
	expect(str.image).toBe(`'lix_internal_state_vtable in a string'`);
});

test('captures contiguous range "lix_internal_state_vtable AS v"', () => {
	const sql = `SELECT * FROM   lix_internal_state_vtable   AS   v  WHERE 1=1`;
	const tok = tokenize(sql);
	const iFrom = tok.findIndex((t) => t.tokenType === FROM);
	expect(iFrom).toBeGreaterThanOrEqual(0);

	const tableTok = requireToken(tok[iFrom + 1], "table ident");
	const asTok = requireToken(tok[iFrom + 2], "AS keyword");
	const aliasTok = requireToken(tok[iFrom + 3], "alias token");

	const start = ensureOffset(tableTok.startOffset, tableTok.image);
	const end = ensureOffset(aliasTok.endOffset, aliasTok.image);
	const frag = sql.slice(start, end + 1);

	expect(asTok.image.toUpperCase()).toBe("AS");
	expect(frag).toContain("lix_internal_state_vtable");
	expect(frag).toMatch(/lix_internal_state_vtable[\s\S]*AS[\s\S]*v/);
});

test("tokenizes positional and named placeholders", () => {
	const sql = `SELECT *
    FROM lix_internal_state_vtable r
    WHERE r.schema_key = ?
      AND r.snapshot_content = :named
      AND r.created_by = @user
      AND r.updated_by = $param`;
	const tok = tokenize(sql);

	const mark = requireToken(
		tok.find((t) => t.tokenType === QMark),
		"question placeholder"
	);
	const colon = requireToken(
		tok.find((t) => t.tokenType === ColonName),
		"colon placeholder"
	);
	const at = requireToken(
		tok.find((t) => t.tokenType === AtName),
		"at placeholder"
	);
	const dollar = requireToken(
		tok.find((t) => t.tokenType === DollarName),
		"dollar placeholder"
	);

	expect(sliceBy(sql, mark)).toBe("?");
	expect(sliceBy(sql, colon)).toBe(":named");
	expect(sliceBy(sql, at)).toBe("@user");
	expect(sliceBy(sql, dollar)).toBe("$param");
});

test("does not tokenize placeholders inside strings", () => {
	const sql = `SELECT '$param :x @y ?' AS s FROM lix_internal_state_vtable`;
	const tok = tokenize(sql);

	const placeholderHits = tok.filter((t) =>
		[DollarName, ColonName, AtName, QMark].includes(t.tokenType)
	);
	expect(placeholderHits.length).toBe(0);

	const str = requireToken(
		tok.find((t) => t.tokenType === SQStr),
		"string literal token"
	);
	expect(str.image).toBe(`'$param :x @y ?'`);
});

test("keeps json path string intact", () => {
	const sql = `SELECT json_extract(iv.snapshot_content, '$.value') FROM lix_internal_state_vtable iv`;
	const tok = tokenize(sql);

	const str = requireToken(
		tok.find((t) => t.tokenType === SQStr),
		"json path literal"
	);
	expect(str.image).toBe(`'$.value'`);
});

test("skips block comments and preserves offsets", () => {
	const sql = `SELECT /* block comment */ *\n    FROM\n      /* comment with lix_internal_state_vtable */\n      lix_internal_state_vtable r\n    WHERE /* inline */ r.schema_key = 'reader_key'\n  `;
	const tokens = tokenize(sql);
	expectMonotonicOffsets(tokens);

	const tableTok = requireToken(
		tokens.find(
			(t) => t.tokenType === Ident && t.image === "lix_internal_state_vtable"
		),
		"real table identifier"
	);
	expect(sliceBy(sql, tableTok)).toBe("lix_internal_state_vtable");

	const literal = requireToken(
		tokens.find((t) => t.tokenType === SQStr && t.image === `'reader_key'`),
		"reader key literal"
	);
	expect(sliceBy(sql, literal)).toBe(`'reader_key'`);
});

test("tokenizes numeric literals and signed limits", () => {
	const sql = `SELECT 42, 3.14, 1.2e3, 4E-2 FROM lix_internal_state_vtable r LIMIT -1`;
	const tokens = tokenize(sql);

	const numImages = tokens
		.filter((t) => t.tokenType === Num)
		.map((t) => t.image);
	expect(numImages).toContain("42");
	expect(numImages).toContain("3.14");
	expect(numImages).toContain("1.2e3");
	expect(numImages).toContain("4E-2");
	expect(numImages).toContain("1");

	const minus = requireToken(
		tokens.find((t) => t.tokenType === Minus),
		"minus token"
	);
	expect(minus.image).toBe("-");
});

test("distinguishes dollar-number params", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable r WHERE r.schema_key = $1 AND r.created_by = $param`;
	const tokens = tokenize(sql);

	const dollarNumber = requireToken(
		tokens.find((t) => t.tokenType === DollarNumber),
		"dollar number placeholder"
	);
	expect(dollarNumber.image).toBe("$1");

	const dollarNames = tokens
		.filter((t) => t.tokenType === DollarName)
		.map((t) => t.image);
	expect(dollarNames).toContain("$param");
	expect(dollarNames).not.toContain("$1");
});

test("tokenizes join with quoted reader and mock table", () => {
	const sql = `SELECT * FROM "lix_internal_state_vtable" r JOIN mock_other_table m ON m.reader_id = r.reader_id`;
	const tokens = tokenize(sql);

	const fromIx = tokens.findIndex((t) => t.tokenType === FROM);
	expect(fromIx).toBeGreaterThanOrEqual(0);
	const joinIx = tokens.findIndex((t) => t.tokenType === JOIN);
	expect(joinIx).toBeGreaterThan(fromIx);

	const readerTok = requireToken(tokens[fromIx + 1], "quoted reader");
	expect(readerTok.tokenType).toBe(QIdent);
	expect(readerTok.image).toBe(`"lix_internal_state_vtable"`);

	const mockTok = requireToken(tokens[joinIx + 1], "mock table ident");
	expect(mockTok.tokenType).toBe(Ident);
	expect(mockTok.image).toBe("mock_other_table");

	const equalsTok = requireToken(
		tokens.find((t) => t.tokenType === Equals),
		"equals token in join predicate"
	);
	expect(equalsTok.image).toBe("=");
});

test("tokenizes CTE with nested select", () => {
	const sql = `WITH reader AS (SELECT * FROM lix_internal_state_vtable) SELECT * FROM reader`;
	const tokens = tokenize(sql);

	const withIx = tokens.findIndex((t) => t.tokenType === WITH);
	expect(withIx).toBeGreaterThanOrEqual(0);

	const lParenCount = tokens.filter((t) => t.tokenType === LParen).length;
	const rParenCount = tokens.filter((t) => t.tokenType === RParen).length;
	expect(lParenCount).toBe(rParenCount);

	const innerTable = requireToken(
		tokens.find(
			(t) => t.tokenType === Ident && t.image === "lix_internal_state_vtable"
		),
		"inner table"
	);
	expect(innerTable.image).toBe("lix_internal_state_vtable");
});

test("continues tokenizing after unknown characters", () => {
	const sql = `SELECT ☺ FROM lix_internal_state_vtable`; // smiley is intentionally unsupported
	const tokens = tokenize(sql);

	const tableTok = requireToken(
		tokens.find(
			(t) => t.tokenType === Ident && t.image === "lix_internal_state_vtable"
		),
		"table token after unknown char"
	);
	expect(tableTok.image).toBe("lix_internal_state_vtable");

	// We expect at least one token even though the smiley is unrecognized
	expect(tokens.length).toBeGreaterThan(0);
});

function sliceBy(source: string, token: Token) {
	const start = ensureOffset(token.startOffset, token.image);
	const end = ensureOffset(token.endOffset, token.image);
	return source.slice(start, end + 1);
}

function expectMonotonicOffsets(tokens: Token[]) {
	let lastEnd = -1;
	for (const token of tokens) {
		const start = ensureOffset(token.startOffset, token.image);
		expect(start).toBeGreaterThan(lastEnd);
		lastEnd = ensureOffset(token.endOffset, token.image);
	}
}

function ensureOffset(value: number | undefined, label: string): number {
	if (value == null) {
		throw new Error(`Token ${label} missing offset information`);
	}
	return value;
}

function requireToken<T extends Token>(
	value: T | undefined,
	message: string
): T {
	if (!value) {
		throw new Error(`Expected token: ${message}`);
	}
	return value;
}
