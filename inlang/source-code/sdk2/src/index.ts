export { newProject } from "./project/newProject.js";
export { loadProjectInMemory } from "./project/loadProjectInMemory.js";
export {
	loadProjectFromDirectory,
	/**
	 * @deprecated use `loadProjectFromDirectory()` instead (it's a rename)
	 */
	loadProjectFromDirectory as loadProjectFromDirectoryInMemory,
} from "./project/loadProjectFromDirectory.js";
export type { InlangProject } from "./project/api.js";
export * from "./json-schema/settings.js";
export * from "./json-schema/pattern.js";
export * from "./mock/index.js";
export * from "./helper.js";
export * from "./query-utilities/index.js";
export {
	humanId,
	/**
	 * @deprecated use `humandId()` instead (it's a rename)
	 */
	humanId as generateBundleId
} from "./human-id/human-id.js";
export type { InlangDatabaseSchema } from "./database/schema.js";
export type { ResourceFile } from "./project/api.js";
export type { InlangPlugin } from "./plugin/schema.js";
export type { IdeExtensionConfig } from "./plugin/meta/ideExtension.js";
export * from "./database/schema.js";
