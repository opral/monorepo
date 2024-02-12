/**
 * A list of packages that we consider relevant for stack detection.
 *
 * We (Loris & Nils) decided against using _all_ packages because that would be too much unnecessary data
 * that would slow down queries.
 */
const RelevantPackages = [
	"next",
	"solid",
	"solid-start",
	"svelte",
	"@sveltejs/kit",
	"@sveltejs/adaper-static",
	"@sveltejs/adapter-node",
	"@sveltejs/adapter-netlify",
	"@sveltejs/adapter-vercel",
	"@sveltejs/adapter-cloudflare-workers",
	"@sveltejs/adapter-auto",
	"vue",
	"nuxt",
	"react",
	"react-native",
	"remix",
	"astro",
	"flutter",
	"vite",
	"webpack",
	"rollup",
	"esbuild",
	"qwick",
	"parcel",
	"lit",
	"lit-html",
	"@angular/core",
] as const

type RelevantPackage = (typeof RelevantPackages)[number]

export type StackInfo = {
	/**
	 * A map of relevant packages to their versions.
	 */
	packages: {
		[packageName in RelevantPackage]?: string
	}
}

/**
 * Returns information about the tech-stack used based on the package.json.
 * It will return an object with a map of relevant packages and their versions
 * as the `packages` property.
 *
 * If no interestring packages are found, the `packages` property will be an empty object.
 * If an error occurs, the `packages` property will be an empty object.
 *
 * @example
 *
 * ```ts
 * {
 *  "packages": {
 *     "next": "^14.0.0",
 *     "react": "^17.0.0"
 *   }
 * }
 * ```
 *
 * @param packageJson The JSON parsed package.json file.
 */
export function getStackInfo(packageJson: unknown): StackInfo {
	const packages: { [packageName in RelevantPackage]?: string } = {}

	try {
		const pkg = packageJson as { [key: string]: any }
		const dependencies = pkg?.dependencies ?? {}
		const devDependencies = pkg?.devDependencies ?? {}
		const peerDependencies = pkg?.peerDependencies ?? {}

		const allDependencies = { ...dependencies, ...devDependencies, ...peerDependencies }

		for (const dependencyName of RelevantPackages) {
			if (dependencyName in allDependencies) {
				const dependencyVersion = allDependencies[dependencyName]
				if (typeof dependencyVersion !== "string") continue
				packages[dependencyName] = dependencyVersion
			}
		}

		return { packages }
	} catch (error) {
		return { packages }
	}
}
