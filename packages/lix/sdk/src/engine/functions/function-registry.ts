import type { LixEngine } from "../boot.js";

export type Call = (name: string, args?: unknown) => any;

export type FunctionHandlerContext = {
	engine: Pick<
		LixEngine,
		| "sqlite"
		| "hooks"
		| "executeSync"
		| "runtimeCacheRef"
		| "call"
		| "preprocessQuery"
	>;
};

export type RegisteredFunctionDefinition = {
	name: string;
	handler: (ctx: FunctionHandlerContext, args: any) => any;
};

export type FunctionRegistry = {
	register: (def: RegisteredFunctionDefinition) => void;
	call: Call;
	list: () => readonly { name: string }[];
};

type RegisteredFunction = {
	handler: RegisteredFunctionDefinition["handler"];
};

export function createFunctionRegistry(args: {
	getEngine: () => Pick<
		LixEngine,
		| "sqlite"
		| "hooks"
		| "executeSync"
		| "runtimeCacheRef"
		| "call"
		| "preprocessQuery"
	>;
}): FunctionRegistry {
	const functions = new Map<string, RegisteredFunction>();

	const register = (def: RegisteredFunctionDefinition): void => {
		if (functions.has(def.name)) {
			throw new Error(`Function "${def.name}" is already registered.`);
		}
		functions.set(def.name, { handler: def.handler });
	};

	const call: Call = (name, argsValue) => {
		const entry = functions.get(name);
		if (!entry) {
			const err: any = new Error(`Unknown function: ${name}`);
			err.code = "LIX_CALL_UNKNOWN";
			throw err;
		}
		const engine = args.getEngine();
		return entry.handler({ engine }, argsValue);
	};

	const list = () => Array.from(functions.keys(), (name) => ({ name }));

	return {
		register,
		call,
		list,
	};
}
