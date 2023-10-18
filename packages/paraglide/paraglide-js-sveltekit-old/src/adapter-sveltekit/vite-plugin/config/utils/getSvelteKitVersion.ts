import { readFile } from "node:fs/promises"
import { PATH_TO_CWD } from "../virtualModule.js"

export const getSvelteKitVersion = async () => {
	const packageName = "@sveltejs/kit"
	const pkg = await import(/* @vite-ignore */ packageName).catch(() => ({}))
	if ("VERSION" in pkg) return pkg.VERSION

	const { findDepPkgJsonPath } = await import("vitefu")

	const pkgJsonPath = await findDepPkgJsonPath(packageName, PATH_TO_CWD).catch(() => undefined)
	if (!pkgJsonPath) return undefined

	try {
		const pkgJson = JSON.parse(await readFile(pkgJsonPath, { encoding: "utf-8" }).catch(() => "{}"))
		return pkgJson.version
	} catch {
		return undefined
	}
}
