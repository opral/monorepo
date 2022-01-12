import { Identifier, Message, Pattern, TextElement } from '@fluent/syntax';
import { adapters } from '@inlang/adapters';
import { Resources } from '../src/resources';
import { serializeEntry } from '../src/utils/serializeEntry';

let resources: Resources;

beforeEach(() => {
    const api = Resources.parse({
        adapter: adapters.fluent,
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
    it('should be truthy when a message exists', () => {
        expect(resources.doesMessageExist({ id: 'test', languageCode: 'en' })).toBeTruthy();
    });

    it('should be falsy when a message not exists', () => {
        expect(resources.doesMessageExist({ id: 'extra', languageCode: 'de' })).toBeFalsy();
    });
});
describe('getMessage()', () => {
    it('simple: should not be undefined and match the expected result', () => {
        const result = resources.getMessage({ id: 'test', languageCode: 'en' });
        if (result === undefined) {
            fail();
        }
        expect(serializeEntry(result)).toMatch('this is my test');
    });

    it('complex(er): should not be undefined and match the expected result', () => {
        const result = resources.getMessage({ id: 'complex', languageCode: 'en' });
        if (result === undefined) {
            fail();
        }
        expect(serializeEntry(result)).toMatch('complex = Hello { $name }');
    });

    it('should return undefined if a message does not exist', () => {
        const result = resources.getMessage({ id: 'undefined-key', languageCode: 'en' });
        expect(result).toBeUndefined();
    });
});

describe('getMessageForAllResources()', () => {
    it('should return all messages', () => {
        const messages = resources.getMessageForAllResources({ id: 'test' });

        const result: Record<string, string> = {};

        for (const languageCode in messages) {
            const message = messages[languageCode];
            if (message) {
                result[languageCode] = serializeEntry(message);
            }
        }

        const match = {
            en: 'test = this is my test',
            da: 'test = dette er min test',
            de: 'test = dis ist ein test',
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

describe('deleteMessageForAllResources()', () => {
    it('should delete the message for all resources', () => {
        const result = resources.deleteMessageForAllResources({ id: 'test' });
        if (result.isErr) {
            fail();
        }
        for (const languageCode of resources.containedLanguageCodes()) {
            expect(resources.getMessage({ id: 'test', languageCode })).toBeUndefined();
        }
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
        const mockMessage = new Message(new Identifier('test'), new Pattern([new TextElement('why not this instead')]));

        const update = resources.updateMessage({ id: 'test', languageCode: 'en', with: mockMessage });
        if (update.isErr) {
            fail();
        }
        const result = resources.getMessage({ id: 'test', languageCode: 'en' });
        if (result === undefined) {
            fail();
        }
        expect(serializeEntry(result)).toMatch('test = why not this instead');
    });

    it('should fail when the language code does not exist', () => {
        const mockMessage = new Message(new Identifier('test'), new Pattern([new TextElement('why not this instead')]));
        const result = resources.updateMessage({ id: 'test', languageCode: 'aa', with: mockMessage });
        expect(result.isErr).toBeTruthy();
    });

    it('should fail when the message id is not found', () => {
        const mockMessage = new Message(
            new Identifier('unknown-id'),
            new Pattern([new TextElement('why not this instead')])
        );
        const result = resources.updateMessage({ id: 'unknown-id', languageCode: 'en', with: mockMessage });
        expect(result.isErr).toBeTruthy();
    });

    it('should fail when the given id does not equal the with.id', () => {
        const mockMessage = new Message(new Identifier('test'), new Pattern([new TextElement('why not this instead')]));
        const result = resources.updateMessage({ id: 'differnet-id', languageCode: 'en', with: mockMessage });
        expect(result.isErr).toBeTruthy();
    });

    it('should be able to upsert', () => {
        const mockMessage = new Message(
            new Identifier('unknown-id'),
            new Pattern([new TextElement('why not this instead')])
        );
        const result = resources.updateMessage(
            { id: 'unknown-id', languageCode: 'en', with: mockMessage },
            { upsert: true }
        );
        expect(result.isOk).toBeTruthy();
        const getMessage = resources.getMessage({ id: 'unknown-id', languageCode: 'en' });
        expect(getMessage).toEqual(mockMessage);
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
        expect(serializeEntry(message)).toMatch('en nøgle uden oversættelse');
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
        const result = resources.serialize({ adapter: adapters.fluent });
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
