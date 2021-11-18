import * as fs from 'fs';
import { Typesafei18nAdapter } from '../../src/adapters/typesafei18nAdapter';

describe('Typesafei18nAdapter', () => {
    const mockFiles = fs.readFileSync('./tests/mockFiles/typesafe.en.ts').toString();
    const adapter = new Typesafei18nAdapter();
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
