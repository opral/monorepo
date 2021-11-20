import { lastIndexOf } from 'lodash';
import { FluentAdapter } from '../src/adapters/fluentAdapter';
import { TranslationAPI } from '../src/fluent/formatter';

describe('constructor', () => {
    const translationAPI = TranslationAPI.initialize({
        adapter: new FluentAdapter(),
        files: [
            { languageCode: 'en', data: 'test = this is my test\nhello = hello there' },
            { languageCode: 'da', data: 'test = dette er min test\nhello = hej med dig' },
            { languageCode: 'de', data: 'test = dis ist ein test\nhello = hallo mit dich' },
        ],
        baseLanguage: 'en',
    });
    if (translationAPI.isErr) {
        fail();
    }

    let testVariable;
    it('should print out the test key', () => {
        testVariable = translationAPI.value.getTranslation('test', 'en');
        if (testVariable.isErr) {
            fail();
        }
        expect(testVariable.value).toMatch('test = this is my test');
    });

    it('should create a key', () => {
        testVariable = translationAPI.value.createKey('new_test', 'here is another translation');
        if (testVariable.isErr) {
            fail();
        }
        testVariable = translationAPI.value.getTranslation('new_test', 'en');
        if (testVariable.isErr) {
            fail();
        }
        expect(testVariable.value).toMatch('new_test = here is another translation');
    });

    it('should delete a key', () => {
        testVariable = translationAPI.value.deleteKey('test');
        if (testVariable.isErr) {
            fail();
        }
        testVariable = translationAPI.value.getTranslation('test', 'en');
        expect(testVariable.isErr).toBeTruthy();
    });

    it('should update a key', () => {
        testVariable = translationAPI.value.updateKey('new_test', 'why not this instead', 'en');
        if (testVariable.isErr) {
            fail();
        }
        testVariable = translationAPI.value.getTranslation('new_test', 'en');
        if (testVariable.isErr) {
            fail();
        }
        expect(testVariable.value).toMatch('new_test = why not this instead');
    });

    it('should check for missing translations', () => {
        testVariable = translationAPI.value.checkMissingTranslations();
        if (testVariable.isErr) {
            fail();
        }
        expect(testVariable.value).toEqual([{ key: 'new_test', languageCodes: ['da', 'de'] }]);
    });
});
