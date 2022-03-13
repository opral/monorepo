import { FluentConverter } from './converter';

describe('FluentConverter', () => {
    const converter = new FluentConverter();
    it('should parse ok', () => {
        const result = converter.parse({ data: testFile });
        expect(result.isOk);
    });

    it('should serialize ok', () => {
        const parse = converter.parse({ data: testFile });
        if (parse.isErr) throw parse.error;
        const serialize = converter.serialize({ resource: parse.value });
        expect(serialize.isOk);
    });

    it('should have the same abstract syntax trees after multiple parsings and serializations', () => {
        const parse1 = converter.parse({ data: testFile });
        if (parse1.isErr) throw parse1.error;
        const serialize1 = converter.serialize({ resource: parse1.value });
        if (serialize1.isErr) throw serialize1.error;
        const parse2 = converter.parse({ data: serialize1.value });
        if (parse2.isErr) throw parse2.error;
        expect(parse1.value).toEqual(parse2.value);
    });
});

const testFile = `
# Try editing the translations below.
# Set $variables' values in the Config tab.

hello = Yes, Hello World!


a-message =
    .with-an-attribute = This is the attributes pattern.

shared-photos =
    { $userName } { $photoCount ->
        [one] added a new photo
       *[other] added { $photoCount } new photos
    } to { $userGender ->
        [male] his stream
        [female] her stream
       *[other] their stream
    }.

# This is a comment
-my-name = Samuel

`;
