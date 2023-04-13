import { initConfig } from "@inlang/sdk-js/config"
import type { RequestEvent } from "@sveltejs/kit"
import type { InlangFunction } from "@inlang/sdk-js/runtime"
import { inlangSymbol } from "./inlang.js"

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

type LocalsInlangInformation = {
	referenceLanguage: string
	languages: string[]
	language: string
	i: InlangFunction
}

export const setInlangInformationToLocals = (
	locals: RequestEvent["locals"],
	payload: LocalsInlangInformation,
) => ((locals as any)[inlangSymbol] = payload)

export const getInlangInformationFromLocals = (
	locals: RequestEvent["locals"],
): LocalsInlangInformation => (locals as any)[inlangSymbol]
