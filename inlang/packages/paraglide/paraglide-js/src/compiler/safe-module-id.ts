/**
 * Turns an unsafe module id like `helloWorld🍌` into a safe one like `helloworld__`.
 *
 * Mainly exists to support https://github.com/opral/inlang-paraglide-js/issues/285
 */
export function toSafeModuleId(id: string): string {
	const result = id.toLowerCase().replace(/[^a-z0-9_]/g, "_");

	const startsWithNumber = result[0]?.match(/[0-9]/);

	if (startsWithNumber) {
		return "_" + result;
	} else if (reservedJsKeywords.includes(result)) {
		return "_" + result;
	}

	let numUppercase = 0;
	for (const char of id) {
		if (char.match(/[A-Z]/)) {
			numUppercase++;
		}
	}

	return result + (numUppercase > 0 ? `${numUppercase}` : "");
}

export function isSafeModuleId(id: string): boolean {
	return toSafeModuleId(id) === id;
}

const reservedJsKeywords = [
	"break",
	"case",
	"catch",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"else",
	"export",
	"extends",
	"false",
	"finally",
	"for",
	"function",
	"if",
	"import",
	"in",
	"instanceof",
	"new",
	"null",
	"return",
	"super",
	"switch",
	"this",
	"throw",
	"true",
	"try",
	"typeof",
	"var",
	"void",
	"while",
	"with",

	//Strict mode reserved keywords
	"let",
	"static",
	"yield",
	"await",

	//Reserved keywords for future use
	"enum",
	"implements",
	"interface",
	"package",
	"private",
	"protected",
	"public",

	// https://github.com/opral/inlang-paraglide-js/issues/331
	"then",
];
