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

`
