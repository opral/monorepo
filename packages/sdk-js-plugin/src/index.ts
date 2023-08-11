export { type SdkConfig, type SdkConfigInput, validateSdkConfig } from "./api.js"
import type { InlangModule } from "@inlang/module"
import { sdkPlugin } from "./plugin.js"

export default {
	plugins: [sdkPlugin],
} satisfies InlangModule["default"]
