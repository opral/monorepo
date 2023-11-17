export type { NodeishFilesystem } from "./NodeishFilesystemApi.js"
export { createNodeishMemoryFs } from "./implementations/memoryFs.js"
export {
	normalizePath,
	normalPath, // FIXME: unify with normalizePath
	getBasename,
	getDirname,
	assertIsAbsolutePath,
} from "./utilities/helpers.js"
