import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { openLix } from "../../lix/index.js";
import { createQueryPreprocessor } from "./create-query-preprocessor.js";
import { createQueryPreprocessorV2 } from "./create-query-preprocessor-v2.js";
import { createInternalStateVtablePreprocessor } from "./internal-state-vtable.js";
import * as tokenizerModule from "./sql-rewriter/tokenizer.js";
import * as expandQueryModule from "./expand-query.js";
import * as analyzeShapeModule from "./sql-rewriter/microparser/analyze-shape.js";
import * as rewriteSqlModule from "./sql-rewriter/rewrite-sql.js";

type SqlSample = {
	sql: string;
	parameters: ReadonlyArray<unknown>;
};

/**
 * Representative SQL inputs used to compare the legacy and Chevrotain-based
 * preprocessors. Each entry is intentionally small so the benchmarks focus on
 * rewrite overhead rather than result materialisation.
 *
 * @example
 * for (const sample of SAMPLES) {
 * 	preprocess(sample);
 * }
 */
const SAMPLES: SqlSample[] = [
	{
		sql: `SELECT json_extract(s.snapshot_content, '$.value.enabled') AS enabled
		FROM internal_state_vtable s
		WHERE s.schema_key = 'lix_key_value'
			AND s.entity_id = 'test'
		LIMIT 1`,
		parameters: [],
	},
	{
		sql: `SELECT "key", "version", "value"
		FROM "stored_schema"
		WHERE "key" = 'lix_state_schema' AND "version" = '1.0'`,
		parameters: [],
	},
	{
		sql: `SELECT "change"."schema_key", "change"."entity_id"
		FROM "change_set_element"
		JOIN "change" ON "change_set_element"."change_id" = "change"."id"
		WHERE "change_set_id" = ?`,
		parameters: ["some-change-set"],
	},
];

describe("createQueryPreprocessor benchmarks", () => {
	let lix: Awaited<ReturnType<typeof openLix>>;
	let preprocessV1: Awaited<ReturnType<typeof createQueryPreprocessor>>;
	let preprocessV2: Awaited<ReturnType<typeof createQueryPreprocessorV2>>;
	const metrics = {
		tokenize: 0,
		expand: 0,
		analyze: 0,
		rewrite: 0,
	};
	const original = {
		tokenize: tokenizerModule.tokenize,
		expandQuery: expandQueryModule.expandQuery,
		analyzeShape: analyzeShapeModule.analyzeShape,
		rewriteSql: rewriteSqlModule.rewriteSql,
	};

	let tokenizeSpy: any;
	let expandSpy: any;
	let analyzeSpy: any;
	let rewriteSpy: any;

	beforeAll(async () => {
		tokenizeSpy = vi.spyOn(tokenizerModule, "tokenize").mockImplementation(((
			sql: string
		) => {
			const start = performance.now();
			const result = original.tokenize(sql);
			metrics.tokenize += performance.now() - start;
			return result;
		}) as typeof tokenizerModule.tokenize);

		expandSpy = vi.spyOn(expandQueryModule, "expandQuery").mockImplementation(((
			args
		) => {
			const start = performance.now();
			const result = original.expandQuery(args);
			metrics.expand += performance.now() - start;
			return result;
		}) as typeof expandQueryModule.expandQuery);

		analyzeSpy = vi
			.spyOn(analyzeShapeModule, "analyzeShape")
			.mockImplementation(((tokens) => {
				const start = performance.now();
				const result = original.analyzeShape(tokens);
				metrics.analyze += performance.now() - start;
				return result;
			}) as typeof analyzeShapeModule.analyzeShape);

		rewriteSpy = vi.spyOn(rewriteSqlModule, "rewriteSql").mockImplementation(((
			sql,
			options
		) => {
			const start = performance.now();
			const result = original.rewriteSql(sql, options);
			metrics.rewrite += performance.now() - start;
			return result;
		}) as typeof rewriteSqlModule.rewriteSql);

		lix = await openLix({});
		preprocessV1 = await createQueryPreprocessor(lix.engine!, [
			createInternalStateVtablePreprocessor,
		]);
		preprocessV2 = await createQueryPreprocessorV2(lix.engine!);
	});

	afterAll(async () => {
		tokenizeSpy?.mockRestore();
		expandSpy?.mockRestore();
		analyzeSpy?.mockRestore();
		rewriteSpy?.mockRestore();
		await lix.close();
	});

	const runSamples = (
		preprocess: Awaited<ReturnType<typeof createQueryPreprocessor>>
	) => {
		let lengthSum = 0;
		for (let i = 0; i < 32; i += 1) {
			const sample = SAMPLES[i % SAMPLES.length]!;
			const result = preprocess(sample);
			lengthSum += result.sql.length;
		}
		return lengthSum;
	};

	const rounds = 10;

	test("compare preprocessors", () => {
		let accum = 0;

		const measure = (
			label: string,
			runner: Awaited<ReturnType<typeof createQueryPreprocessor>>
		) => {
			const start = performance.now();
			for (let i = 0; i < rounds; i += 1) {
				accum ^= runSamples(runner);
			}
			const perRunUs = ((performance.now() - start) * 1000) / rounds;
			// eslint-disable-next-line no-console
			console.info(
				`[preprocessor bench] ${label}: ${perRunUs.toFixed(2)} µs per run`
			);
			return perRunUs;
		};

		const v1Us = measure("v1", preprocessV1);
		const before = { ...metrics };
		const v2Us = measure("v2", preprocessV2);
		const roundsInv = 1 / rounds;
		const tokenizeUs = (
			(metrics.tokenize - before.tokenize) *
			1000 *
			roundsInv
		).toFixed(2);
		const expandUs = (
			(metrics.expand - before.expand) *
			1000 *
			roundsInv
		).toFixed(2);
		const analyzeUs = (
			(metrics.analyze - before.analyze) *
			1000 *
			roundsInv
		).toFixed(2);
		const rewriteUs = (
			(metrics.rewrite - before.rewrite) *
			1000 *
			roundsInv
		).toFixed(2);
		// eslint-disable-next-line no-console
		console.info(
			`[preprocessor bench] v2 breakdown (µs per run) -> tokenize=${tokenizeUs}, expand=${expandUs}, analyze=${analyzeUs}, rewrite=${rewriteUs}`
		);

		expect(Number.isFinite(v1Us) && Number.isFinite(v2Us)).toBe(true);
		void accum;
	});
});
