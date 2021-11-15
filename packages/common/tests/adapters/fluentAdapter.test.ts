import { FluentAdapter } from '../../src/adapters/fluentAdapter';
import * as fs from 'fs';

describe('FluentAdapter', () => {
    const mockFiles = fs.readFileSync('./tests/mockFiles/en.fluent').toString();
    const adapter = new FluentAdapter();
    it('should parse a mock file without an error', () => {
        const result = adapter.parse(mockFiles);
        expect(result.data).not.toBeNull();
        expect(result.error).toBeNull();
    });

    it('should serialize without an error', () => {
        const parsing = adapter.parse(mockFiles);
        if (parsing.data === null) {
            throw parsing.error;
        }
        const serialization = adapter.serialize(parsing.data);
        expect(serialization.data).not.toBeNull();
        expect(serialization.error).toBeNull();
    });
});
