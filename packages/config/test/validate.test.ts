import { validate } from '../src/validate';

it('should return Result.ok for a valid config', () => {
    const config = {
        $schema: 'https://uri.com',
        pathPattern: './translations/{languageCode}.ftl',
        fetchUsageGrammarFrom: 'https://github.com',
        fileFormat: 'fluent',
    };
    const result = validate({ config });
    if (result.isErr) {
        console.error(result.error.message);
    }
    expect(result.isOk).toBeTruthy();
});

it('should return Result.err if $schema is undefined ', () => {
    const config = {
        pathPattern: './translations/{languageCode}.ftl',
        fetchUsageGrammarFrom: 'https://github.com',
        fileFormat: 'fluent',
    };
    const result = validate({ config });
    expect(result.isErr).toBeTruthy();
});

it('should return Result.err if field is missing', () => {
    const config = {
        $schema: 'https://uri.com',
        fetchUsageGrammarFrom: 'https://github.com',
        fileFormat: 'fluent',
    };
    const result = validate({ config });
    expect(result.isErr).toBeTruthy();
});
