import type * as ast from "@inlang/core/ast"
import type { fs as memfs } from "memfs"
import type { Percentage, VNode } from "./markup.js"

/**
 * Get the percentage of translated messages.
 *
 * @param resources The resources to calculate the percentage for.
 * @returns The percentage of translated messages.
 */
export const getRessourcePercentages = (resources: ast.Resource[]) => {
	// Define return type
	const _percentages: Percentage[] = []

	// Calculate the percentage
	resources.map((resource: ast.Resource) => {
		const lintCount = resource.body.reduce((acc: number, message: ast.Message) => {
			if (message.lint) {
				return acc + 1
			}
			return acc
		}, 0)
		const percentage = ((lintCount / resource.body.length) * 100).toFixed(2)

		// Push the percentage to the return array
		_percentages.push({
			lang: resource.languageTag.name,
			percentage: Number(percentage),
			count: {
				total: resource.body.length,
				lint: lintCount,
			},
		})
	})

	return _percentages
}

/**
 * Remove commas from the json.
 *
 * @description When using array.map, satori-html adds commas to the json, which is not valid json for the satori package.
 * @param json The json to remove the commas from.
 * @returns The json without commas.
 */
export const removeCommas = (json: VNode): VNode | undefined => {
	if (!json) return
	if (json.props && json.props.children && Array.isArray(json.props.children)) {
		// @ts-ignore
		json.props.children = json.props.children?.filter((child) => child !== ",")
		// @ts-ignore
		json.props.children = json.props.children?.map(removeCommas)
	}
	return json
}

/**
 * Get the total translated percentage.
 *
 * @description When there are multiple languages, the total translated percentage is the average of all languages.
 * @param percentages The percentages to calculate the total translated percentage for.
 * @returns the total translated percentage.
 */
export const getTotalTranslatedPercentage = (percentages: Percentage[]): number => {
	const total = percentages.reduce((acc, percentage) => acc + percentage.count.total, 0)
	const lint = percentages.reduce((acc, percentage) => acc + percentage.count.lint, 0)
	const totalPercentage = ((lint / total) * 100).toFixed(2)

	return Number(totalPercentage)
}

/**
 * Patching relative paths to absolute paths.
 *
 * @description Memfs does not support relative paths, so we need to patch them.
 * @param fs The fs to patch.
 * @returns The patched fs.
 */
export const patchedFs = (fs: (typeof memfs)["promises"]) =>
	new Proxy(fs, {
		get: (target, prop) => {
			if (prop === "readFile") {
				return (path: string) => {
					if (path.startsWith("./")) {
						return fs.readFile(path.slice(1))
					}
					return fs.readFile(path)
				}
			} else if (prop === "readdir") {
				return (path: string, args: any) => {
					if (path.startsWith("./")) {
						return fs.readdir(path.slice(1), args)
					}
					return fs.readdir(path, args)
				}
			}
			return target[prop as keyof typeof target]
		},
	})
