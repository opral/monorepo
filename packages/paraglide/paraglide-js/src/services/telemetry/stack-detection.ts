import type { NodeishFilesystem } from "@lix-js/fs"
import { findPackageJson } from "../environment/package.js"

/**
 * A list of packages that we consider relevant for stack detection.
 */
const RelevantPackages = [
	"next",
	"solid",
	"solid-start",
	"svelte",
	"@sveltejs/kit",
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

export async function getStackInfo(fs: NodeishFilesystem, cwd: string): Promise<StackInfo> {
	const packageJsonPath = await findPackageJson(fs, cwd)
	if (packageJsonPath === undefined)
		return {
			packages: {},
		}

	const packages: { [packageName in RelevantPackage]?: string } = {}

	try {
		const packageJson = JSON.parse(await fs.readFile(packageJsonPath, { encoding: "utf-8" }))
		const dependencies = packageJson.dependencies ?? {}
		const devDependencies = packageJson.devDependencies ?? {}
		const peerDependencies = packageJson.peerDependencies ?? {}

		const allDependencies = { ...dependencies, ...devDependencies, ...peerDependencies }

		for (const packageName of RelevantPackages) {
			if (packageName in allDependencies) {
				packages[packageName] = allDependencies[packageName]
			}
		}

		return { packages }
	} catch (error) {
		console.error(`Failed to parse package.json at ${packageJsonPath}`, error)
		return { packages }
	}
}
