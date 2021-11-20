import * as fs from 'fs';
import { Typesafei18nAdapter } from '../../src/adapters/typesafei18nAdapter';

describe('Typesafei18nAdapter', () => {
    const adapter = new Typesafei18nAdapter();
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

const testFile = `/* eslint-disable */
import type { Translation } from '../i18n-types';

const de: Translation = {
    test_key: 'Hallo, hören Sie auf, mir nachzuspionieren!',
    hello: 'Hallo, {name}!',
};

export default de;`;
