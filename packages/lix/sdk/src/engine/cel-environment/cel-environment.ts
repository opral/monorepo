import { Environment } from "@marcbachmann/cel-js";
import type { LixEngine } from "../boot.js";

export type CelEnvironment = {
	/**
	 * Evaluate a CEL expression with the provided context.
	 *
	 * @example
	 * ```ts
	 * const value = env.evaluate("1 + 1", {});
	 * ```
	 */
	evaluate: (expression: string, context: Record<string, unknown>) => unknown;
};

export function createCelEnvironment(args: {
	engine: Pick<LixEngine, "call" | "listFunctions">;
}): CelEnvironment {
	const env = new Environment({
		unlistedVariablesAreDyn: true,
	});

	const programCache = new Map<string, ReturnType<Environment["parse"]>>();

	const callSync = (name: string, callArgs?: unknown): unknown => {
		const result = args.engine.call(name, callArgs);
		if (result instanceof Promise) {
			throw new Error(
				`CEL helper "${name}" returned a Promise; asynchronous helpers are not supported`
			);
		}
		return result;
	};

	for (const { name } of args.engine.listFunctions()) {
		env.registerFunction(`${name}(): dyn`, () => {
			const result = callSync(name);
			return normalizeCelValue(result);
		});
	}

	const evaluate = (
		expression: string,
		context: Record<string, unknown>
	): unknown => {
		let program = programCache.get(expression);
		if (!program) {
			program = env.parse(expression);
			programCache.set(expression, program);
		}
		const result = program(context);
		return normalizeCelValue(result);
	};

	return { evaluate };
}

export function normalizeCelValue(value: unknown): unknown {
	if (typeof value === "bigint") {
		const numeric = Number(value);
		if (Number.isSafeInteger(numeric)) {
			return numeric;
		}
		return value.toString();
	}

	if (Array.isArray(value)) {
		return value.map((entry) => normalizeCelValue(entry));
	}

	if (
		value &&
		typeof value === "object" &&
		!(value instanceof Uint8Array) &&
		!(value instanceof Date)
	) {
		const result: Record<string, unknown> = {};
		for (const [key, nested] of Object.entries(value)) {
			result[key] = normalizeCelValue(nested);
		}
		return result;
	}

	return value;
}
