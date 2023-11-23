import type { TechStack } from "./environments.js"
import fs from "node:fs/promises"
import path from "node:path"

/**
 * Attempts to detect which tech-stack we're running in
 * so that we can tailor the installation instructions to the user.
 */
export async function detectTechStack(): Promise<TechStack> {
	const packageJson = await getPackageJson()
	if (!packageJson) return "other"

	const dependencies = Object.keys(packageJson?.dependencies ?? {})
	const devDependencies = Object.keys(packageJson?.devDependencies ?? {})

	//Check in order of most specific to least specific
	if (dependencies.includes("next")) return "next"
	if (dependencies.includes("solid-start")) return "solid-start"
	if (devDependencies.includes("@sveltejs/kit")) return "sveltekit"
	if (devDependencies.includes("webpack")) return "webpack"
	if (devDependencies.includes("rollup")) return "rollup"
	if (devDependencies.includes("vite")) return "vite"
	return "other"
}

async function getPackageJson(): Promise<Record<string, any> | null> {
	const packageJson = path.join(process.cwd(), "package.json")

	try {
		const contents = await fs.readFile(packageJson, "utf-8")
		return JSON.parse(contents)
	} catch {
		return null
	}
}
