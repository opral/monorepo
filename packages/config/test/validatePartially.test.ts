import { validatePartially } from '../src/validatePartially';

it('should validate a single property', () => {
    const properties = {
        fetchI18nDetectionGrammarFrom: 'https://github.com/grammar.pegjs',
    };
    const result = validatePartially(properties);
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
    const result = validatePartially(properties as any);
    expect(result.isOk).toBeTruthy();
});

it('should return Result.err if a property is incorrect ', () => {
    const properties = {
        pathPattern: './translations.ftl',
    };
    const result = validatePartially(properties);
    expect(result.isErr).toBeTruthy();
});
