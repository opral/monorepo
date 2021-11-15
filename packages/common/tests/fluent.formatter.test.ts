import { FluentAdapter } from '../src/adapters/fluentAdapter';
import { TranslationAPI } from '../src/fluent/formatter';

describe('constructor', () => {
    const translationAPI = new TranslationAPI({
        adapter: new FluentAdapter(),
        locales: [{ language: 'en', data: 'test = this is my test' }],
    });
    it('should print out the test key', () => {
        expect(translationAPI.getTranslation('test', 'en')).toMatch('test = this is my test');
    });
});
