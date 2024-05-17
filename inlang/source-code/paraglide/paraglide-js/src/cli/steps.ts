export { runCompiler } from "./steps/run-compiler.js"
export { checkForUncommittedChanges } from "./steps/check-for-uncomitted-changes.js"
export { initializeInlangProject } from "./steps/initialize-inlang-project.js"
export { maybeAddSherlock } from "./steps/maybe-add-sherlock.js"
export { maybeAddNinja } from "./steps/maybe-add-ninja.js"
export { promptForOutdir } from "./steps/prompt-for-outdir.js"
export { updatePackageJson } from "./steps/update-package-json.js"
export {
	maybeChangeTsConfig,
	maybeChangeTsConfigAllowJs,
	maybeChangeTsConfigModuleResolution,
} from "./steps/update-ts-config.js"
