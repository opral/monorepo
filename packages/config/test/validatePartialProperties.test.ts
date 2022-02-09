import { validatePartialProperties } from '../src/validatePartialProperties';

it('should validate a single property', () => {
    const properties = {
        fetchI18nDetectionGrammarFrom: 'https://github.com/grammar.pegjs',
    };
    const result = validatePartialProperties(properties);
    if (result.isErr) {
        console.error(result.error.message);
    }
    expect(result.isOk).toBeTruthy();
});

it('should validate multiple properties', () => {
    const properties = {
        fetchI18nDetectionGrammarFrom: 'https://github.com/grammar.pegjs',
        fileFormat: 'fluent',
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = validatePartialProperties(properties as any);
    expect(result.isOk).toBeTruthy();
});

it('should return Result.err if a property is incorrect ', () => {
    const properties = {
        pathPattern: './translations.ftl',
    };
    const result = validatePartialProperties(properties);
    expect(result.isErr).toBeTruthy();
});
