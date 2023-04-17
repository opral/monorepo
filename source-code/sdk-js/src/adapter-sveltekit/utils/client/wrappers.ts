import type { Language } from '@inlang/core/ast'
import type { Load, redirect } from "@sveltejs/kit"
import { detectLanguage, type Detector } from '../../../detectors/index.js'

// ------------------------------------------------------------------------------------------------

export const initRootPageLoadWrapper = <PageLoad extends Load<any, any, any, any, any>>(options: {
	browser: boolean
	initDetectors?: (event: Parameters<PageLoad>[0]) => Detector[],
	redirect?: {
		throwable: typeof redirect
		getPath: (event: Parameters<PageLoad>[0], language: Language) => URL | string
	}
}) => ({
	wrap: <Data extends Record<string, any> | void>(load: (event: Parameters<PageLoad>[0]) =>
		Promise<Data> | Data) => async (event: Parameters<PageLoad>[0]): Promise<Data> => {
			if (options.browser) {
				const data = await event.parent()

				const { referenceLanguage, languages } = data
				let language: Language | undefined = data.language

				if (!language || !languages.includes(language)) {
					if (options.redirect) {
						const detectedLanguage = await detectLanguage(
							{ referenceLanguage, languages },
							...(options.initDetectors ? options.initDetectors(event) : [])
						)

						throw options.redirect.throwable(307, options.redirect.getPath(event, detectedLanguage).toString())
					}

					language = undefined
				}
			}

			return load(event)
		}
})
