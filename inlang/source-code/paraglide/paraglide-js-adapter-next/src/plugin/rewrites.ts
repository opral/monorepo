import { NextConfig } from "next"
import { Rewrite } from "next/dist/lib/load-custom-routes"

type FinegrainedRewrites = {
	beforeFiles: Rewrite[]
	afterFiles: Rewrite[]
	fallback: Rewrite[]
}

type MaybePromise<T> = T | Promise<T>
type RewriteGenerator = () => MaybePromise<FinegrainedRewrites | Rewrite[]>

export function addRewrites(config: NextConfig, rewrites: RewriteGenerator) {
	const originalRewrites = config.rewrites

	config.rewrites = async () => {
		const finalRewrites: FinegrainedRewrites = {
			beforeFiles: [],
			afterFiles: [],
			fallback: [],
		}

		const additionalRewrites = await rewrites()
		if (additionalRewrites) {
			if (Array.isArray(additionalRewrites)) {
				finalRewrites.beforeFiles.push(...additionalRewrites)
			} else {
				if (additionalRewrites.beforeFiles) {
					finalRewrites.beforeFiles.push(...additionalRewrites.beforeFiles)
				}
				if (additionalRewrites.afterFiles) {
					finalRewrites.afterFiles.push(...additionalRewrites.afterFiles)
				}
				if (additionalRewrites.fallback) {
					finalRewrites.fallback.push(...additionalRewrites.fallback)
				}
			}
		}

		const originalRewriteResult = await originalRewrites?.()
		if (originalRewriteResult) {
			if (Array.isArray(originalRewriteResult)) {
				finalRewrites.beforeFiles.push(...originalRewriteResult)
			} else {
				if (originalRewriteResult.beforeFiles) {
					finalRewrites.beforeFiles.push(...originalRewriteResult.beforeFiles)
				}
				if (originalRewriteResult.afterFiles) {
					finalRewrites.afterFiles.push(...originalRewriteResult.afterFiles)
				}
				if (originalRewriteResult.fallback) {
					finalRewrites.fallback.push(...originalRewriteResult.fallback)
				}
			}
		}

		return finalRewrites
	}
}
