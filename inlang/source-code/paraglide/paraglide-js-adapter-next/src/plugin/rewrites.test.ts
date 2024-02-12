import { describe, it, expect } from "vitest"
import { addRewrites } from "./rewrites"
import { NextConfig } from "next"

describe.concurrent("Plugin - addRewrites", () => {
	it("defaults to beforeFiles during merging", async () => {
		const config: NextConfig = {}
		addRewrites(config, () => {
			return [
				{
					source: "/about",
					destination: "/",
				},
			]
		})

		if (!config.rewrites) throw new Error("rewrites not defined")
		const resultingRewrites = await config.rewrites()

		expect(resultingRewrites).toEqual({
			beforeFiles: [
				{
					destination: "/",
					source: "/about",
				},
			],
			afterFiles: [],
			fallback: [],
		})
	})

	it("accepts async rewrite functions", async () => {
		const config: NextConfig = {}
		addRewrites(config, async () => {
			await sleep(10)
			return [
				{
					source: "/about",
					destination: "/",
				},
			]
		})

		if (!config.rewrites) throw new Error("rewrites not defined")
		const resultingRewrites = await config.rewrites()

		expect(resultingRewrites).toEqual({
			beforeFiles: [
				{
					destination: "/",
					source: "/about",
				},
			],
			afterFiles: [],
			fallback: [],
		})
	})

	it("merges with existing rewrites (added first)", async () => {
		const config: NextConfig = {
			rewrites: async () => {
				return [
					{
						source: "/second",
						destination: "/",
					},
				]
			},
		}
		addRewrites(config, async () => {
			await sleep(10)
			return [
				{
					source: "/first",
					destination: "/",
				},
			]
		})

		if (!config.rewrites) throw new Error("rewrites not defined")
		const resultingRewrites = await config.rewrites()

		expect(resultingRewrites).toEqual({
			beforeFiles: [
				{
					destination: "/",
					source: "/first",
				},
				{
					destination: "/",
					source: "/second",
				},
			],
			afterFiles: [],
			fallback: [],
		})
	})

	it("merges afterRewrites", async () => {
		const config: NextConfig = {
			rewrites: async () => {
				return [
					{
						source: "/before",
						destination: "/",
					},
				]
			},
		}
		addRewrites(config, async () => {
			await sleep(10)
			return {
				beforeFiles: [],
				afterFiles: [
					{
						source: "/after",
						destination: "/",
					},
				],
				fallback: [],
			}
		})

		if (!config.rewrites) throw new Error("rewrites not defined")
		const resultingRewrites = await config.rewrites()

		expect(resultingRewrites).toEqual({
			beforeFiles: [
				{
					destination: "/",
					source: "/before",
				},
			],
			afterFiles: [
				{
					destination: "/",
					source: "/after",
				},
			],
			fallback: [],
		})
	})
})

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}
