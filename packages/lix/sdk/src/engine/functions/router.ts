import type { FunctionRegistryPublicApi } from "./function-registry.js";

export type Call = (name: string, payload?: unknown) => any;

export function createCallRouter(args: { registry: FunctionRegistryPublicApi }): Call {
	return (name, payload) => args.registry.call(name, payload);
}
