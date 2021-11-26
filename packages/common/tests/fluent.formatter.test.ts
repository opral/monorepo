import { lastIndexOf } from 'lodash';
import { FluentAdapter } from '../src/adapters/fluentAdapter';
import { TranslationAPI } from '../src/fluent/formatter';
import { TranslationFile } from '../src/types/translationFile';

let translationAPI: TranslationAPI;
let testVariable;
beforeEach(() => {
    const api = TranslationAPI.parse({
        adapter: new FluentAdapter(),
        files: [
            {
                languageCode: 'en',
                data: 'test = this is my test\nhello = hello there\ncomplex = Hello {$name}\nextra = a key without translations',
            },
            { languageCode: 'da', data: 'test = dette er min test\nhello = hej med dig\ncomplex = Hej {$name}' },
            { languageCode: 'de', data: 'test = dis ist ein test\nhello = hallo mit dich\ncomplex = Hallo {$name}' },
        ],
        baseLanguage: 'en',
    });
    if (api.isErr) {
        fail();
    } else {
        translationAPI = api.value;
    }
});

describe('doesKeyExist', () => {
    test('Check if key exists, and it does', () => {
        expect(translationAPI.doesKeyExist('test')).toBeTruthy();
    });
});

describe('getTranslation', () => {
    it('should print out the test key', () => {
        testVariable = translationAPI.getTranslation('test', 'en');
        if (testVariable.isErr) {
            fail();
        }
        expect(testVariable.value).toMatch('this is my test');
    });

    it('should print out an advanced key', () => {
        testVariable = translationAPI.getTranslation('complex', 'en');
        if (testVariable.isErr) {
            fail();
        }
        expect(testVariable.value).toMatch('Hello {$name}');
    });
});

describe('getAllTranslations', () => {
    it('should print out all translations', () => {
        testVariable = translationAPI.getAllTranslations('test');
        if (testVariable.isErr) {
            fail();
        }
        const match = [
            { key: 'test', languageCode: 'en', translation: 'this is my test' },
            { key: 'test', languageCode: 'da', translation: 'dette er min test' },
            { key: 'test', languageCode: 'de', translation: 'dis ist ein test' },
        ];
        expect(testVariable.value).toEqual(match);
    });

    it('should return an error when key does not exist', () => {
        testVariable = translationAPI.getAllTranslations('unknown-key');
        expect(testVariable.isErr).toBeTruthy();
    });
});

describe('createKey', () => {
    it('should create a key', () => {
        testVariable = translationAPI.createKey('new_test', 'here is another translation');
        if (testVariable.isErr) {
            fail();
        }
        testVariable = translationAPI.getTranslation('new_test', 'en');
        if (testVariable.isErr) {
            fail();
        }
        expect(testVariable.value).toMatch('here is another translation');
    });

    it('should fail when key already exists', () => {
        testVariable = translationAPI.createKey('test', 'this should fail');
        expect(testVariable.isErr).toBeTruthy();
    });
});

describe('deleteKey', () => {
    it('should delete a key', () => {
        testVariable = translationAPI.deleteKey('test');
        if (testVariable.isErr) {
            fail();
        }
        testVariable = translationAPI.getTranslation('test', 'en');
        expect(testVariable.isErr).toBeTruthy();
    });

    it('should fail when key is not found', () => {
        testVariable = translationAPI.deleteKey('asdf');
        expect(testVariable.isErr).toBeTruthy();
    });
});

describe('getAllKeys', () => {
    it('should get all keys', () => {
        testVariable = translationAPI.getAllKeys();
        if (testVariable.isErr) fail();
        expect(testVariable.value).toEqual(['test', 'hello', 'complex', 'extra']);
    });
});

describe('updateKey', () => {
    it('should update a key', () => {
        testVariable = translationAPI.updateKey('test', 'why not this instead', 'en');
        if (testVariable.isErr) {
            fail();
        }
        testVariable = translationAPI.getTranslation('test', 'en');
        if (testVariable.isErr) {
            fail();
        }
        expect(testVariable.value).toMatch('why not this instead');
    });

    it('should fail when language does not exist', () => {
        testVariable = translationAPI.updateKey('test', 'this should fail', 'aa');
        expect(testVariable.isErr).toBeTruthy();
    });

    it('should fail when key is not found', () => {
        testVariable = translationAPI.updateKey('unknown-key', 'this should fail', 'en');
        expect(testVariable.isErr).toBeTruthy();
    });

    it('should make an empty translation when undefined', () => {
        testVariable = translationAPI.updateKey('test', undefined, 'en');
        if (testVariable.isErr) {
            fail();
        }
        testVariable = translationAPI.getTranslation('test', 'en');
        if (testVariable.isErr) {
            fail(testVariable.error);
        }
        expect(testVariable.value).toMatch('');
    });
});

describe('checkMissingTranslations', () => {
    it('should check for missing translations', () => {
        testVariable = translationAPI.checkMissingTranslations();
        if (testVariable.isErr) {
            fail();
        }
        expect(testVariable.value).toEqual([{ key: 'extra', languageCodes: ['da', 'de'] }]);
    });
});

describe('checkMissingTranslationsForKey', () => {
    it('should check for missing translations when giving a key', () => {
        testVariable = translationAPI.checkMissingTranslationsForKey('extra');
        if (testVariable.isErr) fail(testVariable.error);
        expect(testVariable.value).toEqual([
            { key: 'extra', languageCode: 'da' },
            { key: 'extra', languageCode: 'de' },
        ]);
    });

    it('should return an empty list when there are no missing translations for a key', () => {
        testVariable = translationAPI.checkMissingTranslationsForKey('test');
        if (testVariable.isErr) fail(testVariable.error);
        expect(testVariable.value).toEqual([]);
    });
});

/*describe('updateFile', () => {
    it('should update the files when uploading new ones', () => {
        const newFile: TranslationFile = {
            languageCode: 'de',
            data: 'test = dis ist mein test\nhello = hallo mit dich\ncomplex = Hallo {$name}',
        };
        testVariable = translationAPI.updateFile([newFile]);
        if (testVariable.isErr) fail(testVariable.error);
        const fluentFiles = translationAPI.getFluentFiles();
        if (fluentFiles.isErr) fail(fluentFiles.error);
        for (const fluentFile of fluentFiles.value) {
            if (fluentFile.languageCode === 'de') {
                expect(fluentFile.data).toMatch(
                    'test = dis ist mein test\nhello = hallo mit dich\ncomplex = Hallo {$name}'
                );
            }
        }
    });

    it('should return an error when trying to delete keys', () => {
        const newFile: TranslationFile = {
            languageCode: 'de',
            data: '',
        };
        testVariable = translationAPI.updateFile([newFile]);
        expect(testVariable.isErr).toBeTruthy();
    });

    it('should be possible to override this error', () => {
        const newFile: TranslationFile = {
            languageCode: 'de',
            data: '',
        };
        testVariable = translationAPI.updateFile([newFile], { override: true });
        expect(testVariable.isErr).toBeFalsy();
    });

    it('should return an error when parsing junk', () => {
        const newFile: TranslationFile = {
            languageCode: 'de',
            data: 'asd = ',
        };
        testVariable = translationAPI.updateFile([newFile], { override: true });
        expect(testVariable.isErr).toBeTruthy();
    });
});*/

describe('getFluentFiles', () => {
    it('should get fluent files correctly', () => {
        testVariable = translationAPI.serialize(new FluentAdapter());
        if (testVariable.isErr) fail(testVariable.error);
        expect(testVariable.value).toEqual([
            {
                languageCode: 'en',
                data: 'test = this is my test\nhello = hello there\ncomplex = Hello {$name}\nextra = a key without translations\n',
            },
            { languageCode: 'da', data: 'test = dette er min test\nhello = hej med dig\ncomplex = Hej {$name}\n' },
            { languageCode: 'de', data: 'test = dis ist ein test\nhello = hallo mit dich\ncomplex = Hallo {$name}\n' },
        ]);
    });
});

describe('doesTranslationExist', () => {
    it('should be able to detect a translations existence', () => {
        expect(translationAPI.doesTranslationExist('test', 'en')).toBeTruthy;
    });

    it('should return false when a translation does not exist', () => {
        expect(translationAPI.doesTranslationExist('extra', 'de')).toBeFalsy;
    });
});

describe('createTranslation', () => {
    it('should be possible to create a translation', () => {
        testVariable = translationAPI.createTranslation('extra', 'en nøgle uden oversættelse', 'da');
        if (testVariable.isErr) fail(testVariable.error);
        testVariable = translationAPI.getTranslation('extra', 'da');
        if (testVariable.isErr) fail(testVariable.error);
        expect(testVariable.value).toMatch('en nøgle uden oversættelse');
    });

    it('should be able to parse an empty translation', () => {
        testVariable = translationAPI.createTranslation('extra', undefined, 'da');
        if (testVariable.isErr) fail(testVariable.error);
        testVariable = translationAPI.getTranslation('extra', 'da');
        if (testVariable.isErr) fail(testVariable.error);
        expect(testVariable.value).toMatch('');
    });

    it('should return an error when translation alreaedy exists', () => {
        testVariable = translationAPI.createTranslation('extra', 'this should fail', 'en');
        expect(testVariable.isErr).toBeTruthy;
    });

    it('should return an error when language is not found', () => {
        testVariable = translationAPI.createTranslation('extra', 'this should fail', 'aa');
        expect(testVariable.isErr).toBeTruthy;
    });
});

describe('checkMissingVariables', () => {
    it('should show missing variables', () => {
        testVariable = translationAPI.checkMissingTranslations();
        if (testVariable.isErr) fail();
        expect(testVariable.value).toEqual([{ key: 'extra', languageCodes: ['da', 'de'] }]);
    });
});

describe('compareVariables', () => {
    it('should compare variables correctly', () => {
        testVariable = translationAPI.compareVariables(
            [{ key: 'test', languageCode: 'de', translation: 'dis ist ein {$name}' }],
            { key: 'test', languageCode: 'en', translation: 'this is a name' }
        );
        if (testVariable.isErr) fail();
        expect(testVariable.value).toEqual({ de: { error: ' is missing from base translation', variable: '$name' } });
    });
});

describe('serialize', () => {
    it('should serialize a file correctly', () => {
        testVariable = translationAPI.serialize(new FluentAdapter());
        if (testVariable.isErr) fail();
        expect(testVariable.value).toEqual([
            {
                data: 'test = this is my test\nhello = hello there\ncomplex = Hello {$name}\nextra = a key without translations\n',
                languageCode: 'en',
            },
            {
                data: 'test = dette er min test\nhello = hej med dig\ncomplex = Hej {$name}\n',
                languageCode: 'da',
            },
            {
                data: 'test = dis ist ein test\nhello = hallo mit dich\ncomplex = Hallo {$name}\n',
                languageCode: 'de',
            },
        ]);
    });
});
