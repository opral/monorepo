import {
    Attribute,
    Identifier,
    Message,
    Pattern,
    Placeable,
    Resource,
    TextElement,
    VariableReference,
} from '@fluent/syntax';
import { serializePattern } from '../src';
import { Resources } from '../src/resources';
import { serializeEntry } from '../src/utils/serializeEntry';

let resources: Resources;

beforeEach(() => {
    resources = new Resources({
        resources: {
            en: new Resource([
                new Message(new Identifier('test'), new Pattern([new TextElement('this is my test')])),
                new Message(new Identifier('hello'), new Pattern([new TextElement('hello there')])),
                new Message(
                    new Identifier('complex'),
                    new Pattern([
                        new TextElement('Hello '),
                        new Placeable(new VariableReference(new Identifier('name'))),
                    ])
                ),
                new Message(new Identifier('extra'), new Pattern([new TextElement('a key without translations ')])),
            ]),
            da: new Resource([
                new Message(new Identifier('test'), new Pattern([new TextElement('dette er min test')])),
                new Message(new Identifier('hello'), new Pattern([new TextElement('hej med dig')])),

                new Message(
                    new Identifier('complex'),
                    new Pattern([new TextElement('Hej '), new Placeable(new VariableReference(new Identifier('name')))])
                ),
            ]),
            de: new Resource([
                new Message(new Identifier('test'), new Pattern([new TextElement('dis ist ein test')])),
                new Message(new Identifier('hello'), new Pattern([new TextElement('hallo mit dich')])),
                new Message(
                    new Identifier('complex'),
                    new Pattern([
                        new TextElement('Hallo '),
                        new Placeable(new VariableReference(new Identifier('name'))),
                    ])
                ),
            ]),
        },
    });
});
describe('messageExist()', () => {
    it('should be truthy when a message exists', () => {
        expect(resources.messageExist({ id: 'test', languageCode: 'en' })).toBeTruthy();
    });

    it('should be falsy when a message not exists', () => {
        expect(resources.messageExist({ id: 'extra', languageCode: 'de' })).toBeFalsy();
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
    // hmmm bad. Since resources is not an immutable class and all actions are mutable
    // sub deletions might succeed and are not reversed.
    it('should return Result.ok if the message does not exist for one or more languages', () => {
        const result = resources.deleteMessageForAllResources({ id: 'dasdsa' });
        expect(result.isOk).toBeTruthy();
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
});

describe('createMessage()', () => {
    it('should be possible to add a message', () => {
        const add = resources.createMessage({ id: 'extra', pattern: 'en nøgle uden oversættelse', languageCode: 'da' });
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
        const add = resources.createMessage({ id: 'extra', pattern: '', languageCode: 'da' });
        expect(add.isErr).toBeTruthy();
    });

    it('should be return Result.ok when adding a message with an undefined pattern', () => {
        const create = resources.createMessage({
            id: 'extra',
            pattern: undefined,
            languageCode: 'da',
            attributes: [new Attribute(new Identifier('hi'), new Pattern([]))],
        });
        expect(create.isOk).toBeTruthy();
        const message = resources.getMessage({ id: 'extra', languageCode: 'da' });
        // eslint-disable-next-line unicorn/no-null
        expect(message?.value).toBe(null);
    });

    it('should be return Result.err when adding a message with an undefined pattern without attributes', () => {
        const create = resources.createMessage({
            id: 'extra',
            pattern: undefined,
            languageCode: 'da',
            attributes: [],
        });
        expect(create.isErr).toBeTruthy();
    });

    it('should return an error when a message alreaedy exists', () => {
        const result = resources.createMessage({ id: 'extra', pattern: 'this should fail', languageCode: 'en' });
        expect(result.isErr).toBeTruthy();
    });

    it('should return an error when language code does not exist', () => {
        const result = resources.createMessage({ id: 'extra', pattern: 'this should fail', languageCode: 'aa' });
        expect(result.isErr).toBeTruthy();
    });

    it('should return an error when the message id is invalid', () => {
        const result = resources.createMessage({
            id: 'extra.something',
            pattern: 'this should fail',
            languageCode: 'aa',
        });
        expect(result.isErr).toBeTruthy();
    });
});

describe('attributeExists()', () => {
    it('should be truthy when an attribute exists', () => {
        const create = resources.createAttribute({
            messageId: 'test',
            id: 'login',
            pattern: 'Welcome to this test, please login.',
            languageCode: 'en',
        });
        if (create.isErr) {
            fail(create.error);
        }
        expect(resources.attributeExists({ messageId: 'test', id: 'login', languageCode: 'en' })).toBeTruthy();
    });

    it('should be falsy when a message not exists', () => {
        const create = resources.createAttribute({
            messageId: 'test',
            id: 'login',
            pattern: 'Welcome to this test, please login.',
            languageCode: 'en',
        });
        if (create.isErr) {
            fail(create.error);
        }
        expect(resources.attributeExists({ messageId: 'test', id: 'sfafsafwee', languageCode: 'en' })).toBeFalsy();
    });
});

describe('createAttribute()', () => {
    it('should create an attribute', () => {
        const create = resources.createAttribute({
            messageId: 'test',
            id: 'login',
            pattern: 'Welcome to this test, please login.',
            languageCode: 'en',
        });
        if (create.isErr) {
            fail(create.error);
        }
        const message = resources.getMessage({ id: 'test', languageCode: 'en' });
        expect(message?.attributes[0].id.name).toEqual('login');
        expect(serializePattern(message?.attributes[0].value ?? new Pattern([]))).toEqual(
            'Welcome to this test, please login.'
        );
    });

    it('should return Result.err if the attribute exists already', () => {
        const create = resources.createAttribute({
            messageId: 'test',
            id: 'login',
            pattern: 'Welcome to this test, please login.',
            languageCode: 'en',
        });
        expect(create.isOk).toBeTruthy();
        const create2 = resources.createAttribute({
            messageId: 'test',
            id: 'login',
            pattern: 'Welcome to this test, please login.',
            languageCode: 'en',
        });
        expect(create2.isOk).toBeFalsy();
    });

    it('should create the message if the if the message id does not exist', () => {
        const create = resources.createAttribute({
            messageId: 'balbla-nonexistent',
            id: 'login',
            pattern: 'Welcome to this test, please login.',
            languageCode: 'en',
        });
        if (create.isErr) {
            console.error(create.error);
            fail();
        }
        const message = resources.getMessage({ id: 'balbla-nonexistent', languageCode: 'en' });
        if (message === undefined) {
            fail();
        }
        expect(message.attributes.length > 0).toBeTruthy();
        // eslint-disable-next-line unicorn/no-null
        expect(message.value).toBe(null);
    });

    it('should return Result.err if the pattern is invalid', () => {
        const create = resources.createAttribute({
            messageId: 'test',
            id: 'login',
            pattern: 'Welcome to this {{{}$ test, please login.',
            languageCode: 'en',
        });
        expect(create.isOk).toBeFalsy();
    });
});

describe('updateAttribute()', () => {
    it('should update an attribute', () => {
        const create = resources.createAttribute({
            messageId: 'test',
            id: 'login',
            pattern: 'Welcome to this test, please login.',
            languageCode: 'en',
        });
        if (create.isErr) {
            fail(create.error);
        }
        const update = resources.updateAttribute({
            messageId: 'test',
            id: 'login',
            languageCode: 'en',
            with: new Attribute(
                new Identifier('login'),
                new Pattern([new TextElement('Welcome to this test. Please logout.')])
            ),
        });
        if (update.isErr) {
            fail(update.error);
        }
        const message = resources.getMessage({ id: 'test', languageCode: 'en' });
        expect(message?.attributes[0].id.name).toEqual('login');
        expect(serializePattern(message?.attributes[0].value ?? new Pattern([]))).toEqual(
            'Welcome to this test. Please logout.'
        );
    });

    it('should return Result.err if the messageId does not exist', () => {
        const update = resources.updateAttribute({
            messageId: 'afpihsihg',
            id: 'das',
            with: new Attribute(new Identifier('hi'), new Pattern([])),
            languageCode: 'en',
        });
        expect(update.isErr).toBeTruthy();
    });
    it('should return Result.err if the attribute does not exist and options.upsert is undefined', () => {
        const update = resources.updateAttribute({
            messageId: 'test',
            id: 'login',
            with: new Attribute(new Identifier('hi'), new Pattern([])),
            languageCode: 'en',
        });
        expect(update.isErr).toBeTruthy();
    });
});

describe('getAttribute()', () => {
    it('should update an attribute', () => {
        const create = resources.createAttribute({
            messageId: 'test',
            id: 'login',
            pattern: 'Welcome to this test, please login.',
            languageCode: 'en',
        });
        if (create.isErr) {
            fail(create.error);
        }

        const attribute = resources.getAttribute({ messageId: 'test', id: 'login', languageCode: 'en' });
        expect(serializePattern(attribute?.value ?? new Pattern([]))).toEqual('Welcome to this test, please login.');
    });
});

describe('getAttributeForAllResources()', () => {
    // hmmm bad. Since resources is not an immutable class and all actions are mutable
    // sub deletions might succeed and are not reversed.
    it('should retrieve the attribute for all resources', () => {
        for (const languageCode of resources.containedLanguageCodes()) {
            const create = resources.createAttribute({
                messageId: 'test',
                id: 'login',
                pattern: 'Welcome to this test, please login.',
                languageCode: languageCode,
            });
            if (create.isErr) {
                fail(create.error);
            }
        }
        const attributes = resources.getAttributeForAllResources({ messageId: 'test', id: 'login' });
        expect(Object.keys(attributes).length).toBe(resources.containedLanguageCodes().length);
    });
});

describe('deleteAttribute()', () => {
    it('should delete an attribute', () => {
        const create = resources.createAttribute({
            messageId: 'test',
            id: 'login',
            pattern: 'Welcome to this test, please login.',
            languageCode: 'en',
        });
        if (create.isErr) {
            fail(create.error);
        }
        const attribute = resources.getAttribute({ messageId: 'test', id: 'login', languageCode: 'en' });
        expect(serializePattern(attribute?.value ?? new Pattern([]))).toEqual('Welcome to this test, please login.');
        const deletion = resources.deleteAttribute({ messageId: 'test', id: 'login', languageCode: 'en' });
        expect(deletion.isOk).toBeTruthy();
        const attributeAfterDeletion = resources.getAttribute({ messageId: 'test', id: 'login', languageCode: 'en' });
        expect(attributeAfterDeletion).toBeUndefined();
    });

    it('should return Result.err if the message does not exist', () => {
        const deletion = resources.deleteAttribute({ messageId: 'tadsdasdasdadsest', id: 'login', languageCode: 'en' });
        expect(deletion.isErr).toBeTruthy();
    });

    it('should return Result.err if the message exists but the attribute does not', () => {
        const deletion = resources.deleteAttribute({ messageId: 'test', id: 'logigassagagsagsa', languageCode: 'en' });
        expect(deletion.isErr).toBeTruthy();
    });
});

describe('deleteAttributeForAllResources()', () => {
    it('should return Result.ok when deleting existing attributes', () => {
        for (const languageCode of resources.containedLanguageCodes()) {
            const create = resources.createAttribute({
                messageId: 'test',
                id: 'login',
                pattern: 'Welcome to this test, please login.',
                languageCode: languageCode,
            });
            if (create.isErr) {
                fail(create.error);
            }
        }

        const deletion = resources.deleteAttributeForAllResources({ messageId: 'test', id: 'login' });
        expect(deletion.isOk).toBeTruthy();
    });
    // hmmm bad. Since resources is not an immutable class and all actions are mutable
    // sub deletions might succeed and are not reversed.
    it('should return Result.err when deleting an attribute that does not exist for one language', () => {
        for (const languageCode of resources.containedLanguageCodes().slice(1)) {
            const create = resources.createAttribute({
                messageId: 'test',
                id: 'login',
                pattern: 'Welcome to this test, please login.',
                languageCode: languageCode,
            });
            if (create.isErr) {
                fail(create.error);
            }
        }
        const deletion = resources.deleteAttributeForAllResources({ messageId: 'test', id: 'login' });
        expect(deletion.isErr).toBeTruthy();
    });
});
