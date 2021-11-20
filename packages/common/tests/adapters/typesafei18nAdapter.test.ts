import { Typesafei18nAdapter } from '../../src/adapters/typesafei18nAdapter';

describe('Typesafei18nAdapter', () => {
    const adapter = new Typesafei18nAdapter();
    it('should parse ok', () => {
        const result = adapter.parse(testFile);
        expect(result.isOk);
    });

    it('should serialize ok', () => {
        const parse = adapter.parse(testFile);
        if (parse.isErr) throw parse.error;
        const serialize = adapter.serialize(parse.value);
        expect(serialize.isOk);
    });

    it('should have the same abstract syntax trees after multiple parsings and serializations', () => {
        const parse1 = adapter.parse(testFile);
        if (parse1.isErr) throw parse1.error;
        const serialize1 = adapter.serialize(parse1.value);
        if (serialize1.isErr) throw serialize1.error;
        const parse2 = adapter.parse(serialize1.value);
        if (parse2.isErr) throw parse2.error;
        expect(parse1.value).toEqual(parse2.value);
    });
});

const testFile = `/* eslint-disable */
import type { Translation } from '../i18n-types';

const de: Translation = {
    test_key: 'Hallo, hören Sie auf, mir nachzuspionieren!',
    hello: 'Hallo, {name}!',
};

export default de;`;
