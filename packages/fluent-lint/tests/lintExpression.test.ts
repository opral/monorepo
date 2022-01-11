import {
    Identifier,
    Pattern,
    TextElement,
    Placeable,
    VariableReference,
    SelectExpression,
    Variant,
    StringLiteral,
    NumberLiteral,
    FunctionReference,
    CallArguments,
    MessageReference,
    TermReference,
} from '@inlang/fluent-syntax';
import { lintExpression } from '../src/lintExpression';

it('should return Result.err if the types are not matching', () => {
    const source = new SelectExpression(new VariableReference(new Identifier('hi')), []);
    const target = new VariableReference(new Identifier('hi'));
    const result = lintExpression({ source, target });
    expect(result.isOk).toBeFalsy();
});

it('should be able to lint a string literal', () => {
    const source = new StringLiteral('Hello');
    const target = new StringLiteral('Hello');
    const result = lintExpression({ source, target });
    expect(result.isOk).toBeTruthy();
});

it('should be able to lint a number literal', () => {
    const source = new NumberLiteral('12356');
    const target = new NumberLiteral('12346');
    const result = lintExpression({ source, target });
    expect(result.isOk).toBeTruthy();
});

it('should be able to lint a function reference', () => {
    const source = new FunctionReference(new Identifier('FUNCTION'), new CallArguments());
    const target = new FunctionReference(new Identifier('FUNCTION'), new CallArguments());
    const result = lintExpression({ source, target });
    expect(result.isOk).toBeTruthy();
});

it('should be able to lint a message reference', () => {
    const source = new MessageReference(new Identifier('some-id'));
    const target = new MessageReference(new Identifier('some-id'));
    const result = lintExpression({ source, target });
    expect(result.isOk).toBeTruthy();
});

it('should be able to lint a term reference', () => {
    const source = new TermReference(new Identifier('some-id'));
    const target = new TermReference(new Identifier('some-id'));
    const result = lintExpression({ source, target });
    expect(result.isOk).toBeTruthy();
});

it('should be able to lint a variable reference', () => {
    const source = new VariableReference(new Identifier('some-id'));
    const target = new VariableReference(new Identifier('some-id'));
    const result = lintExpression({ source, target });
    expect(result.isOk).toBeTruthy();
});

it('should be able to lint a placable', () => {
    const source = new Placeable(new StringLiteral('Hi'));
    const target = new Placeable(new StringLiteral('Hi'));
    const result = lintExpression({ source, target });
    expect(result.isOk).toBeTruthy();
});

it('should return Result.ok even though the select expressions variants differs', () => {
    // { $numApples ->
    //       [one] one apple
    //      *[other] { $numApples } apples.
    // }
    const source = new SelectExpression(new VariableReference(new Identifier('numApples')), [
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
    const target = new SelectExpression(new VariableReference(new Identifier('numApples')), [
        new Variant(new Identifier('one'), new Pattern([new TextElement('einen Apfel.')]), false),
        new Variant(new Identifier('two'), new Pattern([new TextElement('zwei Äpfel.')]), false),
        new Variant(
            new Identifier('other'),
            new Pattern([new Placeable(new VariableReference(new Identifier('numApples'))), new TextElement('Äpfel.')]),
            true
        ),
    ]);

    const result = lintExpression({ source, target });
    expect(result.isOk).toBeTruthy();
});

it('should return Result.err if the select expressions selector differ', () => {
    // { $numApples ->
    //       [one] one apple
    //      *[other] { $numApples } apples.
    // }
    const source = new SelectExpression(new VariableReference(new Identifier('numApples')), [
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

    const target = new SelectExpression(new TermReference(new Identifier('numpples')), [
        new Variant(new Identifier('one'), new Pattern([new TextElement('einen Apfel.')]), false),
        new Variant(new Identifier('two'), new Pattern([new TextElement('zwei Äpfel.')]), false),
        new Variant(
            new Identifier('other'),
            new Pattern([new Placeable(new VariableReference(new Identifier('numApples'))), new TextElement('Äpfel.')]),
            true
        ),
    ]);

    const result = lintExpression({ source, target });
    expect(result.isOk).toBeFalsy();
});

it('should return Result.err if the select expression variable reference differs', () => {
    // { $numApples ->
    //       [one] one apple
    //      *[other] { $numApples } apples.
    // }
    const source = new SelectExpression(new VariableReference(new Identifier('numApples')), [
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

    const target = new SelectExpression(new VariableReference(new Identifier('numpples')), [
        new Variant(new Identifier('one'), new Pattern([new TextElement('einen Apfel.')]), false),
        new Variant(new Identifier('two'), new Pattern([new TextElement('zwei Äpfel.')]), false),
        new Variant(
            new Identifier('other'),
            new Pattern([new Placeable(new VariableReference(new Identifier('numApples'))), new TextElement('Äpfel.')]),
            true
        ),
    ]);

    const result = lintExpression({ source, target });
    expect(result.isOk).toBeFalsy();
});
