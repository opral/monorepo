import {
    Pattern,
    Placeable,
    TextElement,
    NumberLiteral,
    SelectExpression,
    VariableReference,
    FunctionReference,
    TermReference,
    MessageReference,
    Identifier,
    CallArguments,
    parsePattern,
} from '@inlang/fluent-ast';
import ftl from '@fluent/dedent';
import { lintPattern } from '../src/lintPattern';

it('should return Result.ok if all references in the source and target match', () => {
    const references = [
        new VariableReference(new Identifier('first')),
        new FunctionReference(new Identifier('second'), new CallArguments()),
        new TermReference(new Identifier('third')),
        new MessageReference(new Identifier('forth')),
    ];
    const source = new Pattern([
        new Placeable(references[0]),
        new TextElement('some text'),
        // nested placeable
        new Placeable(new Placeable(new Placeable(references[1]))),
        new Placeable(references[2]),
        new Placeable(new NumberLiteral('4')),
    ]);

    const target = new Pattern([
        new Placeable(references[0]),
        new TextElement('some text'),
        // nested placeable
        new Placeable(new Placeable(new Placeable(references[1]))),
        new Placeable(references[2]),
        new Placeable(new NumberLiteral('4')),
    ]);

    const result = lintPattern({ source, target });
    expect(result.isOk).toBeTruthy();
});

it('should detect missing references in the target', () => {
    const references = [
        new VariableReference(new Identifier('first')),
        new FunctionReference(new Identifier('second'), new CallArguments()),
        new TermReference(new Identifier('third')),
        new MessageReference(new Identifier('forth')),
    ];
    const source = new Pattern([
        new Placeable(references[0]),
        new TextElement('some text'),
        // nested placeable
        new Placeable(new Placeable(new Placeable(references[1]))),
        new Placeable(references[2]),
        new Placeable(new NumberLiteral('4')),
        // nested selectexpression
        new Placeable(new SelectExpression(references[3], [])),
    ]);

    const target = new Pattern([
        new Placeable(references[0]),
        new TextElement('some text'),
        // nested placeable
        new Placeable(new Placeable(new Placeable(references[1]))),
        new Placeable(references[2]),
        new Placeable(new NumberLiteral('4')),
    ]);

    const result = lintPattern({ source, target });
    expect(result.isOk).toBeFalsy();
});

it('should detect references in the target that do not exist in the source', () => {
    const references = [
        new VariableReference(new Identifier('first')),
        new FunctionReference(new Identifier('second'), new CallArguments()),
        new TermReference(new Identifier('third')),
        new MessageReference(new Identifier('forth')),
    ];
    const source = new Pattern([
        new Placeable(references[0]),
        new TextElement('some text'),
        // nested placeable
        new Placeable(new Placeable(new Placeable(references[1]))),
    ]);

    const target = new Pattern([
        new Placeable(references[0]),
        new TextElement('some text'),
        // nested placeable
        new Placeable(new Placeable(new Placeable(references[1]))),
        new Placeable(references[2]),
        new Placeable(new NumberLiteral('4')),
    ]);

    const result = lintPattern({ source, target });
    expect(result.isOk).toBeFalsy();
});

// Variants are supposed/can be different. If you think otherwise, please open a discussion.
it('should ignore variants', () => {
    const source = parsePattern(ftl`
    { $userName } { $photoCount ->
        [one] added a new photo
       *[other] added { $photoCount } new photos
    } to { $userGender ->
        [male] his stream
        [female] her stream
       *[other] their stream
    }.
    `);
    if (source.isErr) {
        fail();
    }
    const target = parsePattern(ftl`
    { $userName } { $photoCount ->
        [one] added a new photo
       *[other] added { $nonexistend-variable } new photos
    } to { $userGender ->
        [male] his stream
       *[other] their stream
    }.
    `);
    if (target.isErr) {
        fail();
    }
    const result = lintPattern({ source: source.value, target: target.value });
    expect(result.isOk).toBeTruthy();
});
