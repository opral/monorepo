import type { BuildOptions } from "esbuild"
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill"
import dedent from "dedent"

/**
 * These properties are defined by inlang and should not be overwritten by the user.
 */
const propertiesDefinedByInlang = ["bundle", "platform", "format", "target"] as const

/**
 * Use this function to configure the esbuild options for plugins.
 *
 * @example
 *   import { build } from "esbuild"
 *   import { pluginBuildConfig } from "@inlang/core/utilities"
 *
 *   await build(pluginBuildConfig({
 *     // your build options
 *   }))
 */
export function pluginBuildConfig(
	options: Omit<BuildOptions, (typeof propertiesDefinedByInlang)[number]>,
): BuildOptions {
	// type casting. This is safe because we are only adding properties to the options object.
	// furthermore, javascript uses references for objects. thus, no performance penalty.
	const ops = options as BuildOptions

	// ------------ VALIDATION ----------------

	for (const property of propertiesDefinedByInlang) {
		if (ops[property] !== undefined) {
			throw Error(dedent`
				The property \`${property}\` can not be defined.

				Solution: Remove the property from your build options.

				Context: The inlang build config defines this property 
				and thereby ensures that your plugin is built in a way 
				that is compatible with inlang.
			`)
		}
	}

	if (ops.entryPoints === undefined || ops.entryPoints.length !== 1) {
		throw Error(dedent`
			The entryPoints option must be defined and have exactly one entry.

			Solution: Only define one entry point like \`["src/index.js"]\`

			Context: Inlang expects plugins to be a single file that can be imported like
			\`const plugin = await env.$import("https://example.com/plugin.js")\`.
		`)
	}

	// ------------ STATIC OPTIONS ------------

	ops.bundle = true
	ops.platform = "neutral"
	ops.format = "esm"
	// es2020 in anticipation of sandboxing JS with QuickJS in the near future
	ops.target = "es2020"

	// ------------ PLUGINS -------------------
	if (ops.plugins === undefined) {
		ops.plugins = []
	}
	ops.plugins.push(
		// @ts-ignore - for some reason we get a type error here
		NodeModulesPolyfillPlugin(),
	)

	return ops
}
