import { InlangConfig } from '../src/types/inlangConfig';
import { validate } from '../src/validate';

it('should return Result.ok for a valid config', () => {
    const config = {
        $schema: 'https://uri.com',
        pathPattern: './translations/{languageCode}.ftl',
        fetchI18nDetectionGrammarFrom: 'https://github.com/grammar.pegjs',
        fileFormat: 'fluent',
    };
    const result = validate({ config });
    if (result.isErr) {
        console.error(result.error.message);
    }
    expect(result.isOk).toBeTruthy();
});

it('should return Result.err if the pathPattern does not include {languageCode}', () => {
    const config: InlangConfig['0.1'] = {
        $schema:
            'https://raw.githubusercontent.com/inlang/inlang/main/packages/config/src/schemas/v0.1.json',
        fileFormat: 'fluent',
        pathPattern: './translations',
        baseLanguageCode: 'en',
    };
    const result = validate({ config });
    expect(result.isErr).toBeTruthy();
});

it('should return Result.err if a required field is undefined ', () => {
    const config: InlangConfig['0.1'] = {
        $schema:
            'https://raw.githubusercontent.com/inlang/inlang/main/packages/config/src/schemas/v0.1.json',
        pathPattern: './translations/{languageCode}.ftl',
        fetchI18nDetectionGrammarFrom: 'https://github.com/grammar.pegjs',
        fileFormat: 'fluent',
        baseLanguageCode: 'en',
    };
    const result = validate({ config });
    expect(result.isErr).toBeTruthy();
});

it('should return Result.err if optional field is defined but incorrect', () => {
    const config: InlangConfig['0.1'] = {
        $schema:
            'https://raw.githubusercontent.com/inlang/inlang/main/packages/config/src/schemas/v0.1.json',
        pathPattern: './translations/{languageCode}.ftl',
        baseLanguageCode: 'en',
        // no pegjs ending -> can't be grammar
        fetchI18nDetectionGrammarFrom: 'https://github.com/',
        fileFormat: 'fluent',
    };
    const result = validate({ config });
    expect(result.isErr).toBeTruthy();
});
