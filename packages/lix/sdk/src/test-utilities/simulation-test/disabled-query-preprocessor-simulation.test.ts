import { afterEach, describe, expect, test, vi } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { disabledQueryPreprocessorSimulation } from "./disabled-query-preprocessor-simulation.js";
import * as createQueryPreprocessorModule from "../../engine/query-preprocessor/create-query-preprocessor.js";

describe("disabledQueryPreprocessorSimulation", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("skips the query preprocessor while forwarding SQL + parameters to sqlite.exec", async () => {
		const preprocessSpy = vi.fn(
			({
				sql,
				parameters,
			}: {
				sql: string;
				parameters: unknown[];
				sideEffects?: boolean;
			}) => ({
				sql,
				parameters,
			})
		);
		vi.spyOn(
			createQueryPreprocessorModule,
			"createQueryPreprocessor"
		).mockResolvedValue(preprocessSpy as any);

		const lix = await openLix({});
		const engine = lix.engine;
		expect(engine).toBeDefined();

		if (!engine) {
			throw new Error("engine should exist in tests");
		}

		const sqlite = engine.sqlite;
		const execSpy = vi.spyOn(sqlite, "exec");

		const sql = "select ? as value";
		const baselinePreprocessCalls = preprocessSpy.mock.calls.length;
		const baselineExecCalls = execSpy.mock.calls.length;

		const baselineResult = engine.executeSync({ sql, parameters: [1] });
		expect(baselineResult.rows).toEqual([{ value: 1 }]);
		expect(preprocessSpy.mock.calls.length).toBe(baselinePreprocessCalls + 1);
		expect(execSpy.mock.calls.length).toBe(baselineExecCalls + 1);

		preprocessSpy.mockClear();
		execSpy.mockClear();

		const simulated = await disabledQueryPreprocessorSimulation.setup(lix);

		const result = simulated.engine!.executeSync({ sql, parameters: [41] });

		expect(result.rows).toEqual([{ value: 41 }]);
		expect(execSpy).toHaveBeenCalledTimes(1);
		const forwarded = execSpy.mock.calls[0]?.[0];
		expect(forwarded?.sql).toBe(sql);
		expect(forwarded?.bind).toEqual([41]);
		expect(preprocessSpy).not.toHaveBeenCalled();

		await simulated.close();
		execSpy.mockRestore();
	});

	test("restores the original executeSync implementation on close", async () => {
		const lix = await openLix({});
		const engine = lix.engine;
		expect(engine).toBeDefined();

		if (!engine) {
			throw new Error("engine should exist in tests");
		}

		const originalExecuteSync = engine.executeSync;
		const simulated = await disabledQueryPreprocessorSimulation.setup(lix);
		expect(engine.executeSync).not.toBe(originalExecuteSync);
		await simulated.close();

		expect(engine.executeSync).toBe(originalExecuteSync);
	});
});
