import translatorPlugin from "./translatorPlugin.js"
import lintRule from "./lint-rule.js"

export async function devModuleImport(uri: string): Promise<{ default: any }> {
	switch (uri) {
		case "@dev/translator-plugin.js": {
			return {
				default: translatorPlugin,
			}
		}
		case "@dev/lint-rule.js": {
			return {
				default: lintRule,
			}
		}
		default: {
			throw new Error(`unknown uri: ${uri}`)
		}
	}
}
