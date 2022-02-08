import { validate } from '../src/validate';

it('should return Result.ok for a valid config', () => {
    const config = {
        $schema: 'https://uri.com',
        pathPattern: './translations/{languageCode}.ftl',
        fetchUsageGrammarFrom: 'https://github.com/grammar.pegjs',
        fileFormat: 'fluent',
    };
    const result = validate({ config });
    if (result.isErr) {
        console.error(result.error.message);
    }
    expect(result.isOk).toBeTruthy();
});

it('should return Result.err if the pathPattern does not include {languageCode}', () => {
    const config = {
        fileFormat: 'fluent',
        pathPattern: './translations',
    };
    const result = validate({ config });
    expect(result.isErr).toBeTruthy();
});

it('should return Result.err if a required field is undefined ', () => {
    const config = {
        pathPattern: './translations/{languageCode}.ftl',
        fetchUsageGrammarFrom: 'https://github.com/grammar.pegjs',
        fileFormat: 'fluent',
    };
    const result = validate({ config });
    expect(result.isErr).toBeTruthy();
});

it('should return Result.err if optional field is defined but incorrect', () => {
    const config = {
        $schema: 'https://uri.com',
        pathPattern: './translations/{languageCode}.ftl',
        // no pegjs ending -> can't be grammar
        fetchUsageGrammarFrom: 'https://github.com/',
        fileFormat: 'fluent',
    };
    const result = validate({ config });
    expect(result.isErr).toBeTruthy();
});
