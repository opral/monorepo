import type { Resource } from '@inlang/core/ast'
import type { RequestEvent } from "@sveltejs/kit"
import { initConfig } from '../../../config/config.js'
import { inlangSymbol } from "../shared/utils.js"
import type { SvelteKitServerRuntime } from "./runtime.js"

const config = await initConfig()
if (!config) {
	throw Error("could not read `inlang.config.js`")
}

export const referenceLanguage = config.referenceLanguage

export const languages = config.languages

// TODO: fix resources if needed (add missing Keys)
let resources: Resource[]

export const reloadResources = async () => resources = await config.readResources({ config })

await reloadResources()

export const getResource = (language: string) =>
	resources.find(({ languageTag: { name } }) => name === language)

export const addRuntimeToLocals = (
	locals: RequestEvent["locals"],
	runtime: SvelteKitServerRuntime,
) => ((locals as any)[inlangSymbol] = runtime)

export const getRuntimeFromLocals = (locals: RequestEvent["locals"]): SvelteKitServerRuntime =>
	(locals as any)[inlangSymbol]
