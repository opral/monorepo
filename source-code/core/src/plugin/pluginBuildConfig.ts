import type { BuildOptions } from "esbuild"

//! DON'T TOP-LEVEL IMPORT ESBUILD PLUGINS. USE DYNAMIC IMPORTS.
//! See https://github.com/inlang/inlang/issues/486

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
export async function pluginBuildConfig(
	options: Omit<BuildOptions, (typeof propertiesDefinedByInlang)[number]>,
): Promise<BuildOptions> {
	//! It is important to dynamically import esbuild plugins here.
	//! Otherwise, the imported plugins are included in
	//! bundles that have @inlang/core as a dependency.
	//! See https://github.com/inlang/inlang/issues/486
	const { NodeModulesPolyfillPlugin } = await import("@esbuild-plugins/node-modules-polyfill")
	const { dedent } = await import("ts-dedent")
	const exclude = ["@esbuild-plugins/node-modules-polyfill", "ts-dedent"]

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
	//! Extremely important to set platform to neutral.
	//!
	//! Platform neutral ensures that the plugin is build as ESM
	//! with strict EcmaScript semantics. No hacky workarounds,
	//! no CommonJS, no NodeJS, no nothing. Pure EcmaScript.
	//!
	//! Pure ECMAScript is important to future proof the plugin
	//! ecosystem and ease inlang's maintenance burden. Everything
	//! else than pure ESM will die in the long run. We don't want to
	//! take on technical debt now which we will have to MASSIVELY pay off
	//! later.
	ops.platform = "neutral"
	ops.format = "esm"
	// es2020 in anticipation of sandboxing JS with QuickJS in the near future
	ops.target = "es2020"
	if (ops.external === undefined) {
		ops.external = []
	}
	ops.external.push(...exclude)

	// ------------ PLUGINS -------------------

	if (ops.plugins === undefined) {
		ops.plugins = []
	}
	ops.plugins.push(
		// @ts-ignore - types are making problems. not using ts-expect because sometimes they work.
		NodeModulesPolyfillPlugin(),
	)

	return ops
}
