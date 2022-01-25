import { Pattern, Placeable, Reference } from '@inlang/fluent-syntax';

/**
 * Finds references in a pattern.
 *
 */
export function referencesInPattern(pattern: Pattern): Reference[] {
    const result: Reference[] = [];
    for (const element of pattern.elements) {
        if (element.type === 'TextElement') {
            continue;
        }
        switch (element.expression.type) {
            case 'FunctionReference':
                result.push(element.expression);
                break;
            case 'MessageReference':
                result.push(element.expression);
                break;
            case 'TermReference':
                result.push(element.expression);
                break;
            case 'VariableReference':
                result.push(element.expression);
                break;
            case 'SelectExpression':
                // recursion
                result.push(...referencesInPattern(new Pattern([new Placeable(element.expression.selector)])));
                break;
            case 'Placeable':
                // recursion
                result.push(...referencesInPattern(new Pattern([element.expression])));
                break;
            default:
                continue;
        }
    }
    return result;
}
