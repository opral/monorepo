it('is outcommented but must contain at least one test', () => {
    expect(true).toBe(true);
});

/* eslint-disable unicorn/no-empty-file */
// import { LanguageCode } from '@inlang/common';
// import { Typesafei18nConverter } from './converter';

// describe('Typesafei18nConverter', () => {
//     const converter = new Typesafei18nConverter();
//     const serializationOptions = {
//         isBaseLanguage: false,
//         languageCode: 'de' as LanguageCode,
//     };
//     it('should parse ok', () => {
//         const result = converter.parse({ data: testFile });
//         expect(result.isOk);
//     });

//     it('should serialize ok', () => {
//         const parse = converter.parse({ data: testFile });
//         if (parse.isErr) throw parse.error;
//         const serialize = converter.serialize({ resource: parse.value }, serializationOptions);
//         expect(serialize.isOk);
//     });

//     it('should have the same abstract syntax trees after multiple parsings and serializations', () => {
//         const parse1 = converter.parse({ data: testFile });
//         if (parse1.isErr) throw parse1.error;
//         const serialize1 = converter.serialize({ resource: parse1.value }, serializationOptions);
//         if (serialize1.isErr) throw serialize1.error;
//         const parse2 = converter.parse({ data: serialize1.value });
//         if (parse2.isErr) throw parse2.error;
//         expect(parse1.value).toEqual(parse2.value);
//     });
// });

// const testFile = `/* eslint-disable */
// import type { Translation } from '../i18n-types';

// const de: Translation = {
//     test_key: 'Hallo, hören Sie auf, mir nachzuspionieren!',
//     hello: 'Hallo, {name}!',
// };

// export default de;`;
