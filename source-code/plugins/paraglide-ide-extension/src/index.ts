export { type SdkConfig, type SdkConfigInput, validateSdkConfig } from "./api.js"
import { sdkPlugin } from "./plugin.js"

export default {
	plugins: [sdkPlugin],
}
