import type { SimulationTestDef } from "./simulation-test.js";

/**
 * Bypasses the SQL preprocessor so queries execute exactly as authored.
 *
 * Useful for verifying that the engine produces identical results when the
 * query rewriter is disabled and acts purely as an optimisation layer.
 *
 * @example
 * disabledQueryPreprocessorSimulation.setup(lix);
 */
export const disabledQueryPreprocessorSimulation: SimulationTestDef = {
	name: "disabled query preprocessor",
	setup: async (lix) => {
		const engine = lix.engine;
		if (!engine) {
			throw new Error("Expected engine to be available for simulation");
		}

		const originalExecuteSync = engine.executeSync;
		const originalPreprocessQuery = engine.preprocessQuery;

		const bypassExecuteSync: typeof engine.executeSync = ({
			sql,
			parameters,
		}) => {
			const columnNames: string[] = [];
			const rows = engine.sqlite.exec({
				sql,
				bind: parameters ? [...parameters] : ([] as any),
				returnValue: "resultRows",
				rowMode: "object",
				columnNames,
			});
			return { rows };
		};

		engine.executeSync = bypassExecuteSync;
		engine.preprocessQuery = ((args) => args) as typeof engine.preprocessQuery;

		return {
			...lix,
			close: async () => {
				engine.executeSync = originalExecuteSync;
				engine.preprocessQuery = originalPreprocessQuery;
				await lix.close();
			},
		} as typeof lix;
	},
};
