import {
    Identifier,
    Pattern,
    Placeable,
    SelectExpression,
    TextElement,
    VariableReference,
    Variant,
} from '@inlang/fluent-syntax';
import { doesReferenceExist } from '../../src/utils/doesReferenceExist';
import { findMatchingExpression } from '../../src/utils/findMatchingExpression';

it('should find variable reference', () => {
    const expression = new SelectExpression(new VariableReference(new Identifier('numApples')), [
        new Variant(new Identifier('one'), new Pattern([new TextElement('one apple.')]), false),
        new Variant(
            new Identifier('other'),
            new Pattern([
                new Placeable(new VariableReference(new Identifier('numApples'))),
                new TextElement('apples.'),
            ]),
            true
        ),
    ]);
    const pattern = new Pattern([
        new TextElement('Hello '),
        new Placeable(new VariableReference(new Identifier('userName'))),
        new TextElement(' you have'),
        new Placeable(expression),
    ]);
    const result = findMatchingExpression({ expression, pattern });
    expect(result).toEqual(expression);
});

it('should return false for non-existent variable reference', () => {
    const expression = new SelectExpression(new VariableReference(new Identifier('numApples')), [
        new Variant(new Identifier('one'), new Pattern([new TextElement('one apple.')]), false),
        new Variant(
            new Identifier('other'),
            new Pattern([
                new Placeable(new VariableReference(new Identifier('numApples'))),
                new TextElement('apples.'),
            ]),
            true
        ),
    ]);
    const pattern = new Pattern([
        new TextElement('Hello '),
        new Placeable(new VariableReference(new Identifier('userName'))),
        new TextElement(' you have'),
        new Placeable(expression),
    ]);
    const result = doesReferenceExist({ id: new Identifier('non-existend-id'), type: 'VariableReference', pattern });
    expect(result).toBe(false);
});
