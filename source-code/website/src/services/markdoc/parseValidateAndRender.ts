import Markdoc, { type Config, type ValidationError } from "@markdoc/markdoc";
import { tags, components } from "./components/index.js";
import { renderWithSolid } from "./solidPlugin.js";

/**
 * Renders a Markdoc document.
 *
 * Provide the markdown document as a string, the
 * function returns the rendered HTML as a string.
 *
 * @throws
 */
export function parseValidateAndRender(text: string) {
	const ast = Markdoc.parse(text);
	const errors = Markdoc.validate(ast, markdocConfig);
	if (errors.length > 0) {
		throw new Error(String.raw`
            Markdoc validation failed.
            ${errors.map((object) => beautifyError(object.error)).join("\n")}
        `);
	}
	const content = Markdoc.transform(ast, markdocConfig);
	return renderWithSolid(content, {
		components,
	});
}

/**
 * The Markdoc configuration.
 */
const markdocConfig: Config = {
	tags,
};

/**
 * Beautifies a Markdoc error.
 *
 * A Marcdoc ValidationError returns an object. Logging
 * the object to the console is not very helpful. This
 * function returns a string that is easier to read.
 */
function beautifyError(error: ValidationError): string {
	// for now, simply stringify the error
	// TODO:
	// - add information about the name and path of the document
	// - add information about the line and column of the error
	return JSON.stringify(error, null, 4);
}
