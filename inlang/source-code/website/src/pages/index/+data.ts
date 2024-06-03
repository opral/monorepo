import { privateEnv } from "@inlang/env-variables"

export { data }
export type Data = Awaited<ReturnType<typeof data>>

let cachedProjectCount: string | number | undefined = undefined
let cacheLastSet: number | undefined = undefined

async function data() {
	if (
		cachedProjectCount &&
		cacheLastSet &&
		Date.now() - cacheLastSet < 24 * 60 * 60 * 1000 &&
		cachedProjectCount !== "20000+"
	) {
		return {
			projectCount: cachedProjectCount,
		}
	} else {
		let projectCount: string | number | undefined = undefined
		try {
			// prettier-ignore
			const raw = JSON.stringify({
				"refresh": true,
				"query": {
					"kind": "InsightVizNode",
					"source": {
					"kind": "TrendsQuery",
					"properties": {
						"type": "AND",
						"values": [
						{
							"type": "AND",
							"values": []
						}
						]
					},
					"filterTestAccounts": true,
					"dateRange": {
						"date_to": null,
						"date_from": "-180d"
					},
					"series": [
						{
						"kind": "EventsNode",
						"event": "IDE-EXTENSION activated",
						"name": "IDE-EXTENSION activated",
						"custom_name": "Entire ecosystem",
						"math": "dau"
						},
						{
						"kind": "EventsNode",
						"event": "EDITOR clicked in field",
						"name": "EDITOR clicked in field",
						"math": "dau"
						},
						{
						"kind": "EventsNode",
						"event": "SDK loaded project",
						"name": "SDK loaded project",
						"properties": [
							{
							"key": "appId",
							"type": "event",
							"value": [
								"library.inlang.paraglideJs"
							],
							"operator": "exact"
							}
						],
						"math": "unique_group",
						"math_group_type_index": 1
						}
					],
					"interval": "month",
					"breakdownFilter": {
						"breakdown_group_type_index": 1
					},
					"trendsFilter": {
						"showLegend": false,
						"formula": "A + B + C",
						"display": "ActionsLineGraphCumulative",
						"showValuesOnSeries": true
					}
					},
					"full": true
				}
			})

			const response = await fetch(
				`https://eu.posthog.com/api/projects/${privateEnv.PUBLIC_POSTHOG_PROJECT_ID}/query`,
				{
					method: "POST",
					headers: {
						Authorization: "Bearer " + privateEnv.POSTHOG_API_KEY,
						"Content-Type": "application/json",
					},
					body: raw,
					redirect: "follow",
					cache: "no-cache",
				}
			)

			const json = await response.json()
			projectCount = json.results[0].data.at(-1)
		} catch (error) {
			if (cachedProjectCount) {
				projectCount = cachedProjectCount
			} else {
				projectCount = "20000+"
			}
		}

		if (projectCount) {
			cachedProjectCount = Number(projectCount) + 8000
			cacheLastSet = Date.now()
			return {
				projectCount: cachedProjectCount,
			}
		} else {
			return {
				projectCount: "20000+",
			}
		}
	}
}
