export { newProject as newProjectNext } from "./project/newProjectNext.js"
export { newProject } from "./project/newProject.js"
export { loadProjectInMemory } from "./project/loadProjectInMemory.js"
export type { InlangProject } from "./project/api.js"
export * from "./schema/schema.js"
export * from "./schema/settings.js"
export * from "./mock/index.js"
export * from "./helper.js"
export {
	newBundleId,
	/**
	 * @deprecated use newBundleId instead
	 */
	newBundleId as randomHumanId,
} from "./bundle-id/bundle-id.js"
