const REGEX_MODULE_SCRIPT_TAG = /(<script[^]*?context="module"[^]*?>)([^]+?)(<\/script>)/
const REGEX_SCRIPT_TAG = /(<script[^]*?>)([^]+?)(<\/script>)/
const REGEX_STYLE_TAG = /<style[^]*?>[^]+?<\/style>/

export const getSvelteFileParts = (code: string) => {
	let markupContent = code
	let moduleScriptOpeningTag = '<script context="module">\n'
	let moduleScriptClosingTag = '\n</script>'
	let moduleScriptContent: string | undefined = undefined
	let scriptOpeningTag = '<script>\n'
	let scriptClosingTag = '\n</script>'
	let scriptContent: string | undefined = undefined
	let styleContent: string | undefined = undefined

	const moduleScriptMatch = markupContent.match(REGEX_MODULE_SCRIPT_TAG)
	if (moduleScriptMatch) {
		moduleScriptOpeningTag = moduleScriptMatch[1]!
		moduleScriptContent = moduleScriptMatch[2]!
		moduleScriptClosingTag = moduleScriptMatch[3]!

		markupContent = markupContent.replace(moduleScriptMatch[0], '$_INLANG_MODULE_SCRIPT_PLACEHOLDER_$')
	}

	const scriptMatch = markupContent.match(REGEX_SCRIPT_TAG)
	if (scriptMatch) {
		scriptOpeningTag = scriptMatch[1]!
		scriptContent = scriptMatch[2]!
		scriptClosingTag = scriptMatch[3]!

		markupContent = markupContent.replace(scriptMatch[0], '$_INLANG_SCRIPT_PLACEHOLDER_$')
	}

	const styleMatch = markupContent.match(REGEX_STYLE_TAG)
	if (styleMatch) {
		styleContent = styleMatch[0]!

		markupContent = markupContent.replace(styleMatch[0], '$_INLANG_STYLE_PLACEHOLDER_$')
	}

	return {
		get moduleScript(): string | undefined {
			return moduleScriptContent
		},
		set moduleScript(newModuleScript: string) {
			moduleScriptContent = newModuleScript
		},
		get script(): string | undefined {
			return scriptContent
		},
		set script(newScript: string) {
			scriptContent = newScript
		},
		get markup() {
			return markupContent
		},
		set markup(newMarkup: string) {
			markupContent = newMarkup
		},
		toString() {
			let code = markupContent

			code = replacePlaceholder(code, '$_INLANG_SCRIPT_PLACEHOLDER_$', scriptOpeningTag, scriptClosingTag, scriptContent)
			code = replacePlaceholder(code, '$_INLANG_MODULE_SCRIPT_PLACEHOLDER_$', moduleScriptOpeningTag, moduleScriptClosingTag, moduleScriptContent)

			code = code.replace('$_INLANG_STYLE_PLACEHOLDER_$', styleContent!)

			return code.trim()
		}
	}
}

const replacePlaceholder = (code: string, placeholder: string, openTag: string, closeTag: string, content: string | undefined): string => {
	if (code.includes(placeholder)) {
		const newContent = content
			? openTag + content + closeTag
			: ''
		return code.replace(placeholder, newContent)
	} else if (content) {
		return replacePlaceholder(`${placeholder}\n${code}`, placeholder, openTag, closeTag, content)
	}

	return code
}