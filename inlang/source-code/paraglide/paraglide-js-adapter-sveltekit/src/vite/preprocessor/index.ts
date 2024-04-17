import { parse, type PreprocessorGroup } from "svelte/compiler"
import MagicString from "magic-string"
import type { Ast } from "./types.js"
import { shouldApply } from "./precheck.js"
import { rewrite } from "./rewrite.js"
import dedent from "dedent"

export type PreprocessorConfig = Record<string, never>

export type AttributeTranslation = {
	attribute_name: string
	lang_attribute_name?: string
}

export type TranslationDefinition = Record<string, AttributeTranslation[]>

const TRANSLATIONS: TranslationDefinition = {
	a: [
		{
			attribute_name: "href",
			lang_attribute_name: "hreflang",
		},
	],
	form: [
		{
			attribute_name: "action",
		},
	],
	button: [
		{
			attribute_name: "formaction",
		},
	],
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function preprocessor(_config: PreprocessorConfig): PreprocessorGroup {
	return {
		name: "@inlang/paraglide-js-adapter-sveltekit",
		markup: ({ filename, content }) => {
			const NOOP = { code: content }

			//I dont' know when this would happen, but it's better to be safe than sorry
			if (!filename) return NOOP

			//dont' process components owned by the framework
			if (filename.includes(".svelte-kit")) return NOOP

			if (
				content.includes("<ParaglideJS") &&
				content.match(/<a\b[^>]*>.*?<\/a\s*>|<a\b[^>]*\/>/g)
			) {
				console.warn(
					"[paraglide] `<a>` tags in the same file as `<ParaglideJS>` won't be translated.\nConsider moving it into another component.\n" +
						filename
				)
			}

			//Run quick checks to see if preprocessing should be applied - skip parsing if not
			if (!shouldApply(content, TRANSLATIONS)) return NOOP

			//Parse the file
			let ast: Ast
			try {
				ast = parse(content)
			} catch (error) {
				throw new Error(
					dedent`
						[@inlang/paraglide-js-adapter-sveltekit] Failed to parse ${filename}. 
						This may be because you are using a signifficantly newer version of the "svelte" package. 
						Try forcing "@inlang/paraglide-js-adapter-sveltekit" to use your version of "svelte" using pnpm overrides`,
					{ cause: error }
				)
			}

			const code = new MagicString(content)

			const passResult = rewrite({ ast, code, originalCode: content, translations: TRANSLATIONS })

			const before = new Set<string>(passResult.scriptAdditions?.before)
			const after = new Set<string>(passResult.scriptAdditions?.after)

			//Inject any imports that were added by the passes
			modifyScriptTag(ast, code, { before, after })

			//Generate the code and map
			const map = code.generateMap({ hires: true })
			return { code: code.toString(), map }
		},
	}
}

function modifyScriptTag(
	ast: Ast,
	code: MagicString,
	additions: { before?: Iterable<string>; after?: Iterable<string> }
) {
	const before = additions.before ? [...additions.before] : []
	const after = additions.after ? [...additions.after] : []

	if (!ast.instance) {
		code.prepend("<script>\n" + before.join("\n") + "\n" + after.join("\n") + "</script>\n")
	} else {
		//@ts-ignore
		const scriptStart = ast.instance.content.start as number
		//@ts-ignore
		const scriptEnd = ast.instance.content.end as number
		code.appendLeft(scriptStart, "\n" + before.join("\n") + "\n")
		code.appendRight(scriptEnd, "\n" + after.join("\n") + "\n")
	}
}
