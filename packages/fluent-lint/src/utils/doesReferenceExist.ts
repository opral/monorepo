import {
    Expression,
    FunctionReference,
    Identifier,
    MessageReference,
    Pattern,
    Placeable,
    TermReference,
    VariableReference,
} from '@inlang/fluent-syntax';

/**
 * Searches for a a reference in a pattern.
 *
 * Useful to search for a reference in another pattern e.g. the
 * source languages pattern contains three references. Do these
 * three references also exist in another (languages) pattern?
 */
export function doesReferenceExist(args: {
    id: Identifier;
    type: VariableReference['type'] | FunctionReference['type'] | TermReference['type'] | MessageReference['type'];
    pattern: Pattern;
}): boolean {
    const searchTypes = new Set(['FunctionReference', 'MessageReference', 'TermReference', 'VariableReference']);
    for (const element of args.pattern.elements) {
        if (element.type === 'TextElement') {
            continue;
        } else if (element.expression.type === 'Placeable') {
            const searchResult = doesReferenceExist({ ...args, pattern: new Pattern([element.expression]) });
            if (searchResult) {
                return searchResult;
            }
        } else if (element.expression.type === 'SelectExpression') {
            const searchResult = doesReferenceExist({
                ...args,
                pattern: new Pattern([new Placeable(element.expression.selector)]),
            });
            if (searchResult) {
                return searchResult;
            }
        } else if (searchTypes.has(element.expression.type) === false) {
            continue;
        } else {
            if ((element.expression.id as Identifier | undefined)?.name === args.id.name) {
                return true;
            }
        }
    }
    return false;
}
