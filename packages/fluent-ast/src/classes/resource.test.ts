import * as fluent from '@fluent/syntax';
import { Resource } from './resource';

describe('messageExists()', () => {
    const resource = new Resource([
        new fluent.Message(
            new fluent.Identifier('the-message'),
            new fluent.Pattern([new fluent.TextElement('this is a test pattern')])
        ),
    ]);
    it('should be truthy when a message exists', () => {
        expect(resource.messageExists({ id: 'the-message' })).toBeTruthy();
    });

    it('should be falsy when a message does not exist', () => {
        expect(resource.messageExists({ id: 'none-existent' })).toBeFalsy();
    });
});

describe('attributeExists()', () => {
    const resource = new Resource([
        new fluent.Message(
            new fluent.Identifier('with-attribute'),
            new fluent.Pattern([new fluent.TextElement('this is my test')]),
            [
                new fluent.Attribute(
                    new fluent.Identifier('the-attribute'),
                    new fluent.Pattern([new fluent.TextElement('some text pattern')])
                ),
            ]
        ),
    ]);
    it('should be truthy when an attribute exists', () => {
        expect(resource.attributeExists({ messageId: 'with-attribute', id: 'the-attribute' })).toBeTruthy();
    });

    it('should be falsy if the message holding the attribute does not exists', () => {
        expect(resource.attributeExists({ messageId: 'none-existent', id: 'the-attribute' })).toBeFalsy();
    });
});

// describe('getMessage()', () => {
//     it('simple: should not be undefined and match the expected result', () => {
//         const result = resource.getMessage({ id: 'test', languageCode: 'en' });
//         if (result === undefined) {
//             fail();
//         }
//         expect(serializeEntry(result)).toMatch('this is my test');
//     });

//     it('complex(er): should not be undefined and match the expected result', () => {
//         const result = resource.getMessage({ id: 'complex', languageCode: 'en' });
//         if (result === undefined) {
//             fail();
//         }
//         expect(serializeEntry(result)).toMatch('complex = Hello { $name }');
//     });

//     it('should return undefined if a message does not exist', () => {
//         const result = resource.getMessage({ id: 'undefined-key', languageCode: 'en' });
//         expect(result).toBeUndefined();
//     });
// });

// describe('getMessageForAllResource()', () => {
//     it('should return all messages', () => {
//         const messages = resource.getMessageForAllResource({ id: 'test' });

//         const result: Record<string, string> = {};

//         for (const languageCode in messages) {
//             const message = messages[languageCode];
//             if (message) {
//                 result[languageCode] = serializeEntry(message);
//             }
//         }

//         const match = {
//             en: 'test = this is my test',
//             da: 'test = dette er min test',
//             de: 'test = dis ist ein test',
//         };
//         expect(result).toEqual(match);
//     });

//     it('should return an empty object if no messages exist', () => {
//         const result = resource.getMessageForAllResource({ id: 'undefined-key' });
//         expect(result).toEqual({});
//     });
// });

// describe('deleteMessage()', () => {
//     it('retrieving a message should result in undefined after deletion', () => {
//         const deletion = resource.deleteMessage({ id: 'test', languageCode: 'en' });
//         if (deletion.isErr) {
//             fail();
//         }
//         const result = resource.getMessage({ id: 'test', languageCode: 'en' });
//         expect(result).toBeUndefined();
//     });

//     it('should fail when key is not found', () => {
//         const result = resource.deleteMessage({ id: 'asdf', languageCode: 'en' });
//         expect(result.isErr).toBeTruthy();
//     });
// });

// describe('deleteMessageForAllResource()', () => {
//     it('should delete the message for all resource', () => {
//         const result = resource.deleteMessageForAllResource({ id: 'test' });
//         if (result.isErr) {
//             fail();
//         }
//         for (const languageCode of resource.containedLanguageCodes()) {
//             expect(resource.getMessage({ id: 'test', languageCode })).toBeUndefined();
//         }
//     });
//     // hmmm bad. Since resource is not an immutable class and all actions are mutable
//     // sub deletions might succeed and are not reversed.
//     it('should return Result.ok if the message does not exist for one or more languages', () => {
//         const result = resource.deleteMessageForAllResource({ id: 'dasdsa' });
//         expect(result.isOk).toBeTruthy();
//     });
// });

// describe('getMessageIdsForAllResource()', () => {
//     it('should get all ids', () => {
//         const result = resource.getMessageIdsForAllResource();
//         expect(result).toEqual(new Set(['test', 'hello', 'complex', 'extra']));
//     });
// });

// describe('updateMessage()', () => {
//     it('should update a message', () => {
//         const mockMessage = new Message(new Identifier('test'), new Pattern([new TextElement('why not this instead')]));

//         const update = resource.updateMessage({ id: 'test', languageCode: 'en', with: mockMessage });
//         if (update.isErr) {
//             fail();
//         }
//         const result = resource.getMessage({ id: 'test', languageCode: 'en' });
//         if (result === undefined) {
//             fail();
//         }
//         expect(serializeEntry(result)).toMatch('test = why not this instead');
//     });

//     it('should fail when the language code does not exist', () => {
//         const mockMessage = new Message(new Identifier('test'), new Pattern([new TextElement('why not this instead')]));
//         const result = resource.updateMessage({ id: 'test', languageCode: 'aa', with: mockMessage });
//         expect(result.isErr).toBeTruthy();
//     });

//     it('should fail when the message id is not found', () => {
//         const mockMessage = new Message(
//             new Identifier('unknown-id'),
//             new Pattern([new TextElement('why not this instead')])
//         );
//         const result = resource.updateMessage({ id: 'unknown-id', languageCode: 'en', with: mockMessage });
//         expect(result.isErr).toBeTruthy();
//     });

//     it('should fail when the given id does not equal the with.id', () => {
//         const mockMessage = new Message(new Identifier('test'), new Pattern([new TextElement('why not this instead')]));
//         const result = resource.updateMessage({ id: 'differnet-id', languageCode: 'en', with: mockMessage });
//         expect(result.isErr).toBeTruthy();
//     });
// });

// describe('createMessage()', () => {
//     it('should be possible to add a message', () => {
//         const add = resource.createMessage({ id: 'extra', pattern: 'en nøgle uden oversættelse', languageCode: 'da' });
//         if (add.isErr) {
//             fail(add.error);
//         }
//         const message = resource.getMessage({ id: 'extra', languageCode: 'da' });
//         if (message === undefined) {
//             fail();
//         }
//         expect(serializeEntry(message)).toMatch('en nøgle uden oversættelse');
//     });

//     it('should not be possible to add an empty message', () => {
//         const add = resource.createMessage({ id: 'extra', pattern: '', languageCode: 'da' });
//         expect(add.isErr).toBeTruthy();
//     });

//     it('should be return Result.ok when adding a message with an undefined pattern', () => {
//         const create = resource.createMessage({
//             id: 'extra',
//             pattern: undefined,
//             languageCode: 'da',
//             attributes: [new Attribute(new Identifier('hi'), new Pattern([]))],
//         });
//         expect(create.isOk).toBeTruthy();
//         const message = resource.getMessage({ id: 'extra', languageCode: 'da' });
//         // eslint-disable-next-line unicorn/no-null
//         expect(message?.value).toBe(null);
//     });

//     it('should be return Result.err when adding a message with an undefined pattern without attributes', () => {
//         const create = resource.createMessage({
//             id: 'extra',
//             pattern: undefined,
//             languageCode: 'da',
//             attributes: [],
//         });
//         expect(create.isErr).toBeTruthy();
//     });

//     it('should return an error when a message alreaedy exists', () => {
//         const result = resource.createMessage({ id: 'extra', pattern: 'this should fail', languageCode: 'en' });
//         expect(result.isErr).toBeTruthy();
//     });

//     it('should return an error when language code does not exist', () => {
//         const result = resource.createMessage({ id: 'extra', pattern: 'this should fail', languageCode: 'aa' });
//         expect(result.isErr).toBeTruthy();
//     });

//     it('should return an error when the message id is invalid', () => {
//         const result = resource.createMessage({
//             id: 'extra.something',
//             pattern: 'this should fail',
//             languageCode: 'aa',
//         });
//         expect(result.isErr).toBeTruthy();
//     });
// });

// describe('createAttribute()', () => {
//     it('should create an attribute', () => {
//         const create = resource.createAttribute({
//             messageId: 'test',
//             id: 'login',
//             pattern: 'Welcome to this test, please login.',
//             languageCode: 'en',
//         });
//         if (create.isErr) {
//             fail(create.error);
//         }
//         const message = resource.getMessage({ id: 'test', languageCode: 'en' });
//         expect(message?.attributes[0].id.name).toEqual('login');
//         expect(serializePattern(message?.attributes[0].value ?? new Pattern([]))).toEqual(
//             'Welcome to this test, please login.'
//         );
//     });

//     it('should return Result.err if the attribute exists already', () => {
//         const create = resource.createAttribute({
//             messageId: 'test',
//             id: 'login',
//             pattern: 'Welcome to this test, please login.',
//             languageCode: 'en',
//         });
//         expect(create.isOk).toBeTruthy();
//         const create2 = resource.createAttribute({
//             messageId: 'test',
//             id: 'login',
//             pattern: 'Welcome to this test, please login.',
//             languageCode: 'en',
//         });
//         expect(create2.isOk).toBeFalsy();
//     });

//     it('should create the message if the if the message id does not exist', () => {
//         const create = resource.createAttribute({
//             messageId: 'balbla-nonexistent',
//             id: 'login',
//             pattern: 'Welcome to this test, please login.',
//             languageCode: 'en',
//         });
//         if (create.isErr) {
//             console.error(create.error);
//             fail();
//         }
//         const message = resource.getMessage({ id: 'balbla-nonexistent', languageCode: 'en' });
//         if (message === undefined) {
//             fail();
//         }
//         expect(message.attributes.length > 0).toBeTruthy();
//         // eslint-disable-next-line unicorn/no-null
//         expect(message.value).toBe(null);
//     });

//     it('should return Result.err if the pattern is invalid', () => {
//         const create = resource.createAttribute({
//             messageId: 'test',
//             id: 'login',
//             pattern: 'Welcome to this {{{}$ test, please login.',
//             languageCode: 'en',
//         });
//         expect(create.isOk).toBeFalsy();
//     });
// });

// describe('updateAttribute()', () => {
//     it('should update an attribute', () => {
//         const create = resource.createAttribute({
//             messageId: 'test',
//             id: 'login',
//             pattern: 'Welcome to this test, please login.',
//             languageCode: 'en',
//         });
//         if (create.isErr) {
//             fail(create.error);
//         }
//         const update = resource.updateAttribute({
//             messageId: 'test',
//             id: 'login',
//             languageCode: 'en',
//             with: new Attribute(
//                 new Identifier('login'),
//                 new Pattern([new TextElement('Welcome to this test. Please logout.')])
//             ),
//         });
//         if (update.isErr) {
//             fail(update.error);
//         }
//         const message = resource.getMessage({ id: 'test', languageCode: 'en' });
//         expect(message?.attributes[0].id.name).toEqual('login');
//         expect(serializePattern(message?.attributes[0].value ?? new Pattern([]))).toEqual(
//             'Welcome to this test. Please logout.'
//         );
//     });

//     it('should return Result.err if the messageId does not exist', () => {
//         const update = resource.updateAttribute({
//             messageId: 'afpihsihg',
//             id: 'das',
//             with: new Attribute(new Identifier('hi'), new Pattern([])),
//             languageCode: 'en',
//         });
//         expect(update.isErr).toBeTruthy();
//     });
//     it('should return Result.err if the attribute does not exist and options.upsert is undefined', () => {
//         const update = resource.updateAttribute({
//             messageId: 'test',
//             id: 'login',
//             with: new Attribute(new Identifier('hi'), new Pattern([])),
//             languageCode: 'en',
//         });
//         expect(update.isErr).toBeTruthy();
//     });
// });

// describe('getAttribute()', () => {
//     it('should update an attribute', () => {
//         const create = resource.createAttribute({
//             messageId: 'test',
//             id: 'login',
//             pattern: 'Welcome to this test, please login.',
//             languageCode: 'en',
//         });
//         if (create.isErr) {
//             fail(create.error);
//         }

//         const attribute = resource.getAttribute({ messageId: 'test', id: 'login', languageCode: 'en' });
//         expect(serializePattern(attribute?.value ?? new Pattern([]))).toEqual('Welcome to this test, please login.');
//     });
// });

// describe('getAttributeForAllResource()', () => {
//     // hmmm bad. Since resource is not an immutable class and all actions are mutable
//     // sub deletions might succeed and are not reversed.
//     it('should retrieve the attribute for all resource', () => {
//         for (const languageCode of resource.containedLanguageCodes()) {
//             const create = resource.createAttribute({
//                 messageId: 'test',
//                 id: 'login',
//                 pattern: 'Welcome to this test, please login.',
//                 languageCode: languageCode,
//             });
//             if (create.isErr) {
//                 fail(create.error);
//             }
//         }
//         const attributes = resource.getAttributeForAllResource({ messageId: 'test', id: 'login' });
//         expect(Object.keys(attributes).length).toBe(resource.containedLanguageCodes().length);
//     });
// });

// describe('deleteAttribute()', () => {
//     it('should delete an attribute', () => {
//         const create = resource.createAttribute({
//             messageId: 'test',
//             id: 'login',
//             pattern: 'Welcome to this test, please login.',
//             languageCode: 'en',
//         });
//         if (create.isErr) {
//             fail(create.error);
//         }
//         const attribute = resource.getAttribute({ messageId: 'test', id: 'login', languageCode: 'en' });
//         expect(serializePattern(attribute?.value ?? new Pattern([]))).toEqual('Welcome to this test, please login.');
//         const deletion = resource.deleteAttribute({ messageId: 'test', id: 'login', languageCode: 'en' });
//         expect(deletion.isOk).toBeTruthy();
//         const attributeAfterDeletion = resource.getAttribute({ messageId: 'test', id: 'login', languageCode: 'en' });
//         expect(attributeAfterDeletion).toBeUndefined();
//     });

//     it('should return Result.err if the message does not exist', () => {
//         const deletion = resource.deleteAttribute({ messageId: 'tadsdasdasdadsest', id: 'login', languageCode: 'en' });
//         expect(deletion.isErr).toBeTruthy();
//     });

//     it('should return Result.err if the message exists but the attribute does not', () => {
//         const deletion = resource.deleteAttribute({ messageId: 'test', id: 'logigassagagsagsa', languageCode: 'en' });
//         expect(deletion.isErr).toBeTruthy();
//     });
// });

// describe('deleteAttributeForAllResource()', () => {
//     it('should return Result.ok when deleting existing attributes', () => {
//         for (const languageCode of resource.containedLanguageCodes()) {
//             const create = resource.createAttribute({
//                 messageId: 'test',
//                 id: 'login',
//                 pattern: 'Welcome to this test, please login.',
//                 languageCode: languageCode,
//             });
//             if (create.isErr) {
//                 fail(create.error);
//             }
//         }

//         const deletion = resource.deleteAttributeForAllResource({ messageId: 'test', id: 'login' });
//         expect(deletion.isOk).toBeTruthy();
//     });
//     // hmmm bad. Since resource is not an immutable class and all actions are mutable
//     // sub deletions might succeed and are not reversed.
//     it('should return Result.err when deleting an attribute that does not exist for one language', () => {
//         for (const languageCode of resource.containedLanguageCodes().slice(1)) {
//             const create = resource.createAttribute({
//                 messageId: 'test',
//                 id: 'login',
//                 pattern: 'Welcome to this test, please login.',
//                 languageCode: languageCode,
//             });
//             if (create.isErr) {
//                 fail(create.error);
//             }
//         }
//         const deletion = resource.deleteAttributeForAllResource({ messageId: 'test', id: 'login' });
//         expect(deletion.isErr).toBeTruthy();
//     });
// });
