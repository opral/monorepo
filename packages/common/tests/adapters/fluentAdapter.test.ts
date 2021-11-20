import { FluentAdapter } from '../../src/adapters/fluentAdapter';

describe('FluentAdapter', () => {
    const adapter = new FluentAdapter();
    it('should parse a mock file without an error', () => {
        const result = adapter.parse(testFile);
        expect(result.data).not.toBeNull();
        expect(result.error).toBeNull();
    });

    it('should serialize without an error', () => {
        const parsing = adapter.parse(testFile);
        if (parsing.data === null) {
            throw parsing.error;
        }
        const serialization = adapter.serialize(parsing.data);
        expect(serialization.data).not.toBeNull();
        expect(serialization.error).toBeNull();
    });

    it('should have the same abstract syntax trees after multiple parsings and serializations', () => {
        const parse1 = adapter.parse(testFile);
        if (parse1.data === null) throw parse1.error;
        const serialize1 = adapter.serialize(parse1.data);
        if (serialize1.data === null) throw serialize1.error;
        const parse2 = adapter.parse(serialize1.data);
        if (parse2.data === null) throw parse2.error;
        expect(parse1.data).toEqual(parse2.data);
    });
});

const testFile = `
# Try editing the translations below.
# Set $variables' values in the Config tab.

hello = Yes, Hello World!
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
