import type { Load } from "@sveltejs/kit"

// ------------------------------------------------------------------------------------------------

export const initRootPageLoadWrapper = <PageLoad extends Load<any, any, any, any, any>>(options: {
	browser: boolean
	redirectIfNeeded: (event: Parameters<PageLoad>[0]) => any
}) => ({
	wrap: <Data extends Record<string, any> | void>(load: (event: Parameters<PageLoad>[0]) =>
		Promise<Data> | Data) => async (event: Parameters<PageLoad>[0]): Promise<Data> => {
			if (options.browser) await options.redirectIfNeeded(event)

			return load(event)
		}
})
