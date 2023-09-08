export {
	getRuntimeFromData,
	addRuntimeToData,
	type ObjectWithClientRuntime as ObjectWithRuntime,
	addRuntimePromiseToEvent,
	getRuntimePromiseFromEvent,
	type EventWithRuntimePromise,
	replaceLanguageInUrl,
} from "./utils.js"
export { initRootLayoutLoadWrapper, initRootPageLoadWrapper, initLoadWrapper } from "./wrappers.js"
