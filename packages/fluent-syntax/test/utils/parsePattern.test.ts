import ftl from '@fluent/dedent';
import { Identifier, parse, Pattern, Placeable, TextElement, VariableReference } from '@fluent/syntax';
import { parsePattern } from '../../src/utils/parsePattern';

it('should parse a correct pattern', () => {
    const pattern = new Pattern([
        new TextElement('Hello, '),
        new Placeable(new VariableReference(new Identifier('userName'))),
        new TextElement('!'),
    ]);
    const result = parsePattern('Hello, {$userName}!');
    if (result.isErr) {
        fail();
    }
    expect(result.value).toEqual(pattern);
});

it('should return Result.err if an incorrect pattern is being parsed', () => {
    const result = parsePattern('{Junk.com}}');
    expect(result.isErr).toBeTruthy();
});

it('should return Result.err if an attribute is parsed', () => {
    const result = parsePattern(ftl`

    .attribute = Hello
    `);
    expect(result.isErr).toBeTruthy();
});
