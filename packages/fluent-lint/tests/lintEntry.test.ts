import {
    Message,
    Identifier,
    Pattern,
    TextElement,
    Placeable,
    VariableReference,
    SelectExpression,
    Variant,
} from '@inlang/fluent-syntax';
import { lintEntry } from '../src/lintEntry';

// select expression can be different for languages. Think about
// pluralization rules.
//
// See the following discussion https://github.com/inlang/inlang/discussions/87

it('should return Result.ok for a simple message', () => {
    // some-id = Hello { $userName } you have { $numApples ->
    //       [one] one apple
    //      *[other] { $numApples } apples.
    // }
    const source = new Message(
        new Identifier('some-id'),
        new Pattern([
            new TextElement('Hello '),
            new Placeable(new VariableReference(new Identifier('userName'))),
            new TextElement(' you have something.'),
        ])
    );
    const target = new Message(
        new Identifier('some-id'),
        new Pattern([
            new TextElement('Hallo '),
            new Placeable(new VariableReference(new Identifier('userName'))),
            new TextElement(' du hast etwas.'),
        ])
    );
    const result = lintEntry({ source, target });
    expect(result.isOk).toBeTruthy();
});

it('should return Result.err for if a variable reference differs', () => {
    // some-id = Hello { $userName } you have { $numApples ->
    //       [one] one apple
    //      *[other] { $numApples } apples.
    // }
    const source = new Message(
        new Identifier('some-id'),
        new Pattern([
            new TextElement('Hello '),
            new Placeable(new VariableReference(new Identifier('userName'))),
            new TextElement(' you have something.'),
        ])
    );
    const target = new Message(
        new Identifier('some-id'),
        new Pattern([
            new TextElement('Hallo '),
            new Placeable(new VariableReference(new Identifier('starWars'))),
            new TextElement(' du hast etwas.'),
        ])
    );
    const result = lintEntry({ source, target });
    expect(result.isOk).toBeFalsy();
});
it('should return Result.ok even though the select expressions variants differs', () => {
    // some-id = Hello { $userName } you have { $numApples ->
    //       [one] one apple
    //      *[other] { $numApples } apples.
    // }
    const source = new Message(
        new Identifier('some-id'),
        new Pattern([
            new TextElement('Hello '),
            new Placeable(new VariableReference(new Identifier('userName'))),
            new TextElement(' you have'),
            new Placeable(
                new SelectExpression(new VariableReference(new Identifier('numApples')), [
                    new Variant(new Identifier('one'), new Pattern([new TextElement('one apple.')]), false),
                    new Variant(
                        new Identifier('other'),
                        new Pattern([
                            new Placeable(new VariableReference(new Identifier('numApples'))),
                            new TextElement('apples.'),
                        ]),
                        true
                    ),
                ])
            ),
        ])
    );
    const target = new Message(
        new Identifier('some-id'),
        new Pattern([
            new TextElement('Hallo '),
            new Placeable(new VariableReference(new Identifier('userName'))),
            new TextElement(' du hast'),
            new Placeable(
                new SelectExpression(new VariableReference(new Identifier('numApples')), [
                    new Variant(new Identifier('one'), new Pattern([new TextElement('einen Apfel.')]), false),
                    new Variant(new Identifier('two'), new Pattern([new TextElement('zwei Äpfel.')]), false),
                    new Variant(
                        new Identifier('other'),
                        new Pattern([
                            new Placeable(new VariableReference(new Identifier('numApples'))),
                            new TextElement('Äpfel.'),
                        ]),
                        true
                    ),
                ])
            ),
        ])
    );
    const result = lintEntry({ source, target });
    expect(result.isOk).toBeTruthy();
});

it('should return Result.err if the select expression variable reference differs', () => {
    // some-id = Hello { $userName } you have { $numApples ->
    //       [one] one apple
    //      *[other] { $numApples } apples.
    // }
    const source = new Message(
        new Identifier('some-id'),
        new Pattern([
            new TextElement('Hello '),
            new Placeable(new VariableReference(new Identifier('userName'))),
            new TextElement(' you have'),
            new Placeable(
                new SelectExpression(new VariableReference(new Identifier('numApples')), [
                    new Variant(new Identifier('one'), new Pattern([new TextElement('one apple.')]), false),
                    new Variant(
                        new Identifier('other'),
                        new Pattern([
                            new Placeable(new VariableReference(new Identifier('numApples'))),
                            new TextElement('apples.'),
                        ]),
                        true
                    ),
                ])
            ),
        ])
    );
    const target = new Message(
        new Identifier('some-id'),
        new Pattern([
            new TextElement('Hallo '),
            new Placeable(new VariableReference(new Identifier('userName'))),
            new TextElement(' du hast'),
            new Placeable(
                new SelectExpression(new VariableReference(new Identifier('numpples')), [
                    new Variant(new Identifier('one'), new Pattern([new TextElement('einen Apfel.')]), false),
                    new Variant(new Identifier('two'), new Pattern([new TextElement('zwei Äpfel.')]), false),
                    new Variant(
                        new Identifier('other'),
                        new Pattern([
                            new Placeable(new VariableReference(new Identifier('numApples'))),
                            new TextElement('Äpfel.'),
                        ]),
                        true
                    ),
                ])
            ),
        ])
    );
    const result = lintEntry({ source, target });
    expect(result.isOk).toBeFalsy();
});
