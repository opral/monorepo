import { SwiftAdapter } from '../../src/adapters/swiftAdapter';

const mockFile = `
"hello-key" = "You have sold %d apps in %d months"
"samuel-kdeey" = "Hello Magenta 1234"
`;

describe('SwiftAdapter', () => {
    const adapter = new SwiftAdapter();
    it('should parse a mock file without an error', () => {
        const result = adapter.parse(mockFile);
        expect(result.data).not.toBeNull();
        expect(result.error).toBeNull();
    });

    it('should serialize without an error', () => {
        const parsing = adapter.parse(mockFile);
        if (parsing.data === null) {
            throw parsing.error;
        }
        const serialization = adapter.serialize(parsing.data);
        expect(serialization.data).not.toBeNull();
        expect(serialization.error).toBeNull();
    });
});
