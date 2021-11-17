import { lastIndexOf } from 'lodash';
import { FluentAdapter } from '../src/adapters/fluentAdapter';
import { TranslationAPI } from '../src/fluent/formatter';

describe('constructor', () => {
    const translationAPI = new TranslationAPI({
        adapter: new FluentAdapter(),
        files: [
            { languageCode: 'en', data: 'test = this is my test\nhello = hello there' },
            { languageCode: 'da', data: 'test = dette er min test\nhello = hej med dig' },
            { languageCode: 'de', data: 'test = dis ist ein test\nhello = hallo mit dich' },
        ],
        baseLocale: 'en',
    });
    it('should print out the test key', () => {
        expect(translationAPI.getTranslation('test', 'en')).toMatch('test = this is my test');
    });

    it('should create a key', () => {
        translationAPI.createKey('new_test', 'here is another translation');
        expect(translationAPI.getTranslation('new_test', 'en')).toMatch('new_test = here is another translation');
    });

    it('should delete a key', () => {
        translationAPI.deleteKey('test');
        expect(translationAPI.getTranslation('test', 'en')).toBe(null);
    });

    it('should update a key', () => {
        translationAPI.updateKey('new_test', 'why not this instead', 'en');
        expect(translationAPI.getTranslation('new_test', 'en')).toMatch('new_test = why not this instead');
    });

    it('should check for missing translations', () => {
        expect(translationAPI.checkMissingTranslations()).toEqual([{ key: 'new_test', languageCodes: ['da', 'de'] }]);
    });
});
