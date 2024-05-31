import { privateEnv } from "@inlang/env-variables"

export { data }
export type Data = Awaited<ReturnType<typeof data>>

async function data() {
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
		const number = json.results[0].data.at(-1)

		if (number) {
			return {
				projectCount: number,
			}
		} else {
			return {
				projectCount: "10000+",
			}
		}
	} catch (error) {
		return {
			projectCount: "10000+",
		}
	}
}
