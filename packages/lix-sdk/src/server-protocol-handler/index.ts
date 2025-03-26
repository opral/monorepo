export {
	createServerProtocolHandler,
	type LixServerProtocolHandlerContext,
	// Keep the old names for backward compatibility
	createServerApiHandler,
	type LixServerApiHandlerContext,
} from "./create-server-protocol-handler.js";
export {
	createLspInMemoryEnvironment,
	// Keep the old export for backward compatibility
	createLsaInMemoryEnvironment,
} from "./environment/create-in-memory-environment.js";
