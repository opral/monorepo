import { adapter } from '@inlang/adapters';
import { Resources } from '../../src/classes/resources';

let resources: Resources;

beforeEach(() => {
    const api = Resources.parse({
        adapter: adapter.fluent,
        files: [
            {
                languageCode: 'en',
                data: 'test = this is my test\nhello = hello there\ncomplex = Hello {$name}\nextra = a key without translations',
            },
            { languageCode: 'da', data: 'test = dette er min test\nhello = hej med dig\ncomplex = Hej {$name}' },
            { languageCode: 'de', data: 'test = dis ist ein test\nhello = hallo mit dich\ncomplex = Hallo {$name}' },
        ],
        baseLanguageCode: 'en',
    });
    if (api.isErr) {
        fail();
    } else {
        resources = api.value;
    }
});

describe('doesMessageExist()', () => {
    it('should be truthy', () => {
        expect(resources.doesMessageExist({ id: 'test', languageCode: 'en' })).toBeTruthy();
    });
});

describe('getMessage()', () => {
    it('simple: should not be undefined and match the expected result', () => {
        const result = resources.getMessage({ id: 'test', languageCode: 'en' });
        if (result === undefined) {
            fail();
        }
        expect(result).toMatch('this is my test');
    });

    it('complex(er): should not be undefined and match the expected result', () => {
        const result = resources.getMessage({ id: 'complex', languageCode: 'en' });
        if (result === undefined) {
            fail();
        }
        expect(result).toMatch('Hello {$name}');
    });

    it('should return undefined if a message does not exist', () => {
        const result = resources.getMessage({ id: 'undefined-key', languageCode: 'en' });
        expect(result).toBeUndefined();
    });
});

describe('getMessageForAllResources()', () => {
    it('should return all messages', () => {
        const result = resources.getMessageForAllResources({ id: 'test' });

        const match = {
            en: 'this is my test',
            da: 'dette er min test',
            de: 'dis ist ein test',
        };
        expect(result).toEqual(match);
    });

    it('should return an empty object if no messages exist', () => {
        const result = resources.getMessageForAllResources({ id: 'undefined-key' });
        expect(result).toEqual({});
    });
});

describe('deleteMessage()', () => {
    it('retrieving a message should result in undefined after deletion', () => {
        const deletion = resources.deleteMessage({ id: 'test', languageCode: 'en' });
        if (deletion.isErr) {
            fail();
        }
        const result = resources.getMessage({ id: 'test', languageCode: 'en' });
        expect(result).toBeUndefined();
    });

    it('should fail when key is not found', () => {
        const result = resources.deleteMessage({ id: 'asdf', languageCode: 'en' });
        expect(result.isErr).toBeTruthy();
    });
});

describe('getMessageIdsForAllResources()', () => {
    it('should get all ids', () => {
        const result = resources.getMessageIdsForAllResources();
        expect(result).toEqual(new Set(['test', 'hello', 'complex', 'extra']));
    });
});

describe('updateMessage()', () => {
    it('should update a message', () => {
        const update = resources.updateMessage({ id: 'test', value: 'why not this instead', languageCode: 'en' });
        if (update.isErr) {
            fail();
        }
        const result = resources.getMessage({ id: 'test', languageCode: 'en' });
        if (result === undefined) {
            fail();
        }
        expect(result).toMatch('why not this instead');
    });

    it('should fail when languageCode does not exist', () => {
        const result = resources.updateMessage({ id: 'test', value: 'this should fail', languageCode: 'aa' });
        expect(result.isErr).toBeTruthy();
    });

    it('should fail when message is not found', () => {
        const result = resources.updateMessage({ id: 'unknown-key', value: 'this should fail', languageCode: 'en' });
        expect(result.isErr).toBeTruthy();
    });
});

// describe('checkMissingTranslations', () => {
//     it('should check for missing translations', () => {
//         const result = resources.();
//         if (result.isErr) {
//             fail();
//         }
//         expect(result.value).toEqual([{ key: 'extra', languageCodes: ['da', 'de'] }]);
//     });
// });

// describe('checkMissingTranslationsForKey', () => {
//     it('should check for missing translations when giving a key', () => {
//         const result = resources.checkMissingTranslationsForKey('extra');
//         if (result.isErr) fail(result.error);
//         expect(result.value).toEqual([
//             { key: 'extra', languageCode: 'da' },
//             { key: 'extra', languageCode: 'de' },
//         ]);
//     });

//     it('should return an empty list when there are no missing translations for a key', () => {
//         const result = resources.checkMissingTranslationsForKey('test');
//         if (result.isErr) fail(result.error);
//         expect(result.value).toEqual([]);
//     });
// });

/*describe('updateFile', () => {
    it('should update the files when uploading new ones', () => {
        const newFile: TranslationFile = {
            languageCode: 'de',
            data: 'test = dis ist mein test\nhello = hallo mit dich\ncomplex = Hallo {$name}',
        };
        result = resources.updateFile([newFile]);
        if (result.isErr) fail(result.error);
        const fluentFiles = resources.getFluentFiles();
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
        result = resources.updateFile([newFile]);
        expect(result.isErr).toBeTruthy();
    });

    it('should be possible to override this error', () => {
        const newFile: TranslationFile = {
            languageCode: 'de',
            data: '',
        };
        result = resources.updateFile([newFile], { override: true });
        expect(result.isErr).toBeFalsy();
    });

    it('should return an error when parsing junk', () => {
        const newFile: TranslationFile = {
            languageCode: 'de',
            data: 'asd = ',
        };
        result = resources.updateFile([newFile], { override: true });
        expect(result.isErr).toBeTruthy();
    });
});*/

describe('doesMessageExist()', () => {
    it('should be truthy when a message exists', () => {
        expect(resources.doesMessageExist({ id: 'test', languageCode: 'en' })).toBeTruthy();
    });

    it('should be falsy when a message not exists', () => {
        expect(resources.doesMessageExist({ id: 'extra', languageCode: 'de' })).toBeFalsy();
    });
});

describe('createMessage()', () => {
    it('should be possible to add a message', () => {
        const add = resources.createMessage({ id: 'extra', value: 'en nøgle uden oversættelse', languageCode: 'da' });
        if (add.isErr) {
            fail(add.error);
        }
        const message = resources.getMessage({ id: 'extra', languageCode: 'da' });
        if (message === undefined) {
            fail();
        }
        expect(message).toMatch('en nøgle uden oversættelse');
    });

    it('should not be possible to add an empty message', () => {
        const add = resources.createMessage({ id: 'extra', value: ' ', languageCode: 'da' });
        expect(add.isErr).toBeTruthy();
    });

    it('should return an error when a message alreaedy exists', () => {
        const result = resources.createMessage({ id: 'extra', value: 'this should fail', languageCode: 'en' });
        expect(result.isErr).toBeTruthy;
    });

    it('should return an error when language code does not exist', () => {
        const result = resources.createMessage({ id: 'extra', value: 'this should fail', languageCode: 'aa' });
        expect(result.isErr).toBeTruthy;
    });
});

// describe('checkMissingVariables', () => {
//     it('should show missing variables', () => {
//         const result = resources.checkMissingTranslations();
//         if (result.isErr) fail();
//         expect(result.value).toEqual([{ key: 'extra', languageCodes: ['da', 'de'] }]);
//     });
// });

// describe('compareVariables', () => {
//     it('should compare variables correctly', () => {
//         const result = resources.compareVariables(
//             [{ key: 'test', languageCode: 'de', translation: 'dis ist ein {$name}' }],
//             { key: 'test', languageCode: 'en', translation: 'this is a name' }
//         );
//         if (result.isErr) fail();
//         expect(result.value).toEqual({ de: { error: ' is missing from base translation', variable: '$name' } });
//     });
// });

describe('serialize', () => {
    it('should serialize a file correctly', () => {
        const result = resources.serialize({ adapter: adapter.fluent });
        if (result.isErr) fail();
        expect(result.value).toEqual([
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
