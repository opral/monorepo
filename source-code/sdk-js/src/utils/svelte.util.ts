const REGEX_MODULE_SCRIPT_TAG = /(<script[^]*?context="module"[^]*?>)([^]+?)(<\/script>)/
const REGEX_SCRIPT_TAG = /(<script[^]*?>)([^]+?)(<\/script>)/
const REGEX_STYLE_TAG = /<style[^]*?>[^]+?<\/style>/

export const getSvelteFileParts = (code: string) => {
	let markupContent = code
	let moduleScriptOpeningTag = '<script context="module">\n'
	let moduleScriptClosingTag = '\n</script>'
	let moduleScriptContent = ""
	let scriptOpeningTag = '<script>\n'
	let scriptClosingTag = '\n</script>'
	let scriptContent = ""
	let styleTag = ""

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
		styleTag = styleMatch[0]!

		markupContent = markupContent.replace(styleMatch[0], '$_INLANG_STYLE_PLACEHOLDER_$')
	}

	return {
		get moduleScript(): string {
			return moduleScriptContent
		},
		set moduleScript(newModuleScript: string) {
			moduleScriptContent = newModuleScript
		},
		get script(): string {
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
			code = replacePlaceholder(code, '$_INLANG_STYLE_PLACEHOLDER_$', '', '', styleTag, false)

			return code.trim()
		}
	}
}

const replacePlaceholder = (code: string, placeholder: string, openTag: string, closeTag: string, content: string | undefined, insertAtTheTop = true): string => {
	if (code.includes(placeholder)) {
		const newContent = content
			? openTag + content + closeTag // insert new content if specified
			: '' // remove placeholder if content is empty
		return code.replace(placeholder, newContent)
	} else if (content) {
		// insert placeholder if it doesn't exist yet
		const newCode = insertAtTheTop
			? `${placeholder}\n${code}`
			: `${code}\n${placeholder}`
		return replacePlaceholder(newCode, placeholder, openTag, closeTag, content)
	}

	return code
}