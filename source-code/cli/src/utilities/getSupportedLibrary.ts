import { log } from "../utilities.js"
import { bold } from "./format.js"

export type SupportedLibrary = "@inlang/sdk-js" | "i18next" | "typesafe-i18n" | "json"

export const getSupportedLibrary = (args: { packageJson: any }): SupportedLibrary => {
	const dependencies = args.packageJson.dependencies || {}
	const devDependencies = args.packageJson.devDependencies || {}
	const isInlangSdkJsInstalled =
		!!dependencies["@inlang/sdk-js"] || !!devDependencies["@inlang/sdk-js"]
	const isI18nextInstalled = !!dependencies["i18next"] || !!devDependencies["i18next"]
	const isTypesafeI18nInstalled =
		!!dependencies["typesafe-i18n"] || !!devDependencies["typesafe-i18n"]

	// log that supported package was found
	if (isInlangSdkJsInstalled) {
		log.info(`✅ Supported library found: ${bold("@inlang/sdk-js")}`)
	}
	if (isI18nextInstalled) {
		log.info(`✅ Supported library found: ${bold("i18next")}`)
	}
	if (isTypesafeI18nInstalled) {
		log.info(`✅ Supported library found: ${bold("typesafe-i18n")}`)
	}

	// Determine the plugin based on the installed libraries or fallback to JSON plugin
	if (isInlangSdkJsInstalled) {
		return "@inlang/sdk-js"
	} else if (isI18nextInstalled) {
		return "i18next"
	} else if (isTypesafeI18nInstalled) {
		return "typesafe-i18n"
	} else {
		// Fallback, remove this someday
		return "json"
	}
}
