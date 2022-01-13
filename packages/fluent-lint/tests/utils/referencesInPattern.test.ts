import {
    FunctionReference,
    Identifier,
    VariableReference,
    CallArguments,
    TermReference,
    MessageReference,
    Pattern,
    Placeable,
    NumberLiteral,
    SelectExpression,
    TextElement,
} from '@inlang/fluent-syntax';
import { referencesInPattern } from '../../src/utils/referencesInPattern';

it('should find all references', () => {
    const references = [
        new VariableReference(new Identifier('first')),
        new FunctionReference(new Identifier('second'), new CallArguments()),
        new TermReference(new Identifier('third')),
        new MessageReference(new Identifier('forth')),
    ];
    const pattern = new Pattern([
        new Placeable(references[0]),
        new TextElement('some text'),
        // nested placeable
        new Placeable(new Placeable(new Placeable(references[1]))),
        new Placeable(references[2]),
        new Placeable(new NumberLiteral('4')),
        // nested selectexpression
        new Placeable(new SelectExpression(references[3], [])),
    ]);
    const result = referencesInPattern(pattern);
    expect(result).toEqual(references);
});
