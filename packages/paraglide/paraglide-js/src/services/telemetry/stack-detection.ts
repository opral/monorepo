import type { NodeishFilesystem } from "@lix-js/fs"
import { findPackageJson } from "../environment/package.js"

export enum Stack {
	Unknown = "Unknown",
	SvelteKit = "SvelteKit",
	NextJS = "NextJS",
	Astro = "Astro",
	NuxtJS = "NuxtJS",
	ReactNative = "ReactNative",
}

export async function detectStack(fs: NodeishFilesystem, cwd: string): Promise<Stack> {
	const packageJsonPath = await findPackageJson(fs, cwd)
	if (packageJsonPath === undefined) return Stack.Unknown

	try {
		const packageJson = JSON.parse(await fs.readFile(packageJsonPath, { encoding: "utf-8" }))
		const dependencies = Object.keys(packageJson.dependencies ?? {})
		//const devDependencies = Object.keys(packageJson.devDependencies ?? {})

		if (dependencies.includes("svelte") && dependencies.includes("@sveltejs/kit"))
			return Stack.SvelteKit
		if (dependencies.includes("next")) return Stack.NextJS
		if (dependencies.includes("astro")) return Stack.Astro
		if (dependencies.includes("nuxt")) return Stack.NuxtJS
		if (dependencies.includes("react-native") || dependencies.includes("expo"))
			return Stack.ReactNative

		return Stack.Unknown
	} catch (error) {
		console.error(`Failed to parse package.json at ${packageJsonPath}`, error)
		return Stack.Unknown
	}
}
