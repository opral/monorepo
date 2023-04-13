import { initConfig } from "@inlang/sdk-js/config"

const config = await initConfig()
if (!config) {
	throw Error("could not read `inlang.config.js`")
}

export const referenceLanguage = config.referenceLanguage

export const languages = config.languages

// TODO: fix resources if needed (add missing Keys)
const resources = await config.readResources({ config })

export const getResource = (language: string) =>
	resources.find(({ languageTag: { name } }) => name === language)
