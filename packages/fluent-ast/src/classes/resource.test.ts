import { Attribute } from './attribute';
import { Message } from './message';
import { Resource } from './resource';
import { TextElement } from './textElement';

describe('includedMessageIds()', () => {
    const resource = new Resource([
        Message.from({
            id: 'the-message',
            value: 'this is my test',
            attributes: [Attribute.from({ id: 'the-attribute', value: 'some text pattern' }).unwrap()],
        }).unwrap(),
        Message.from({ id: 'second-message' }).unwrap(),
    ]);

    it('should include all message ids', () => {
        expect(resource.includedMessageIds()[0]).toBe('the-message');
        expect(resource.includedMessageIds()[1]).toBe('second-message');
    });

    it('should not include none-existent message ids', () => {
        expect(resource.includedMessageIds().includes('none-existent')).toBeFalsy();
    });
});

describe('includes', () => {
    const resource = new Resource([
        Message.from({
            id: 'the-message',
            value: 'this is my test',
            attributes: [Attribute.from({ id: 'the-attribute', value: 'some text pattern' }).unwrap()],
        }).unwrap(),
    ]);
    describe('Message()', () => {
        it('should be truthy when a message exists', () => {
            expect(resource.includesMessage({ id: 'the-message' })).toBeTruthy();
        });

        it('should be falsy when a message does not exist', () => {
            expect(resource.includesMessage({ id: 'none-existent' })).toBeFalsy();
        });
    });

    describe('Attribute()', () => {
        it('should be truthy when an attribute exists', () => {
            expect(resource.includesAttribute({ messageId: 'the-message', id: 'the-attribute' })).toBeTruthy();
        });

        it('should be falsy if the message holding the attribute does not exists', () => {
            expect(resource.includesAttribute({ messageId: 'none-existent', id: 'the-attribute' })).toBeFalsy();
        });
    });
});

describe('create', () => {
    describe('Message()', () => {
        const resource = new Resource([Message.from({ id: 'first-message', value: 'this is my test' }).unwrap()]);
        it('should create a new message with no attributes', () => {
            const newResource = resource
                .createMessage(Message.from({ id: 'new-message', value: 'new pattern', attributes: [] }).unwrap())
                .unwrap();
            expect(newResource.body.length).toBe(2);
            expect((newResource.body[1] as Message).id.name).toBe('new-message');
        });

        it('should create a new message with attributes', () => {
            const newResource = resource
                .createMessage(
                    Message.from({
                        id: 'new-message',
                        value: 'new pattern',
                        attributes: [Attribute.from({ id: 'new-attribute', value: 'some pattern' }).unwrap()],
                    }).unwrap()
                )
                .unwrap();
            expect(newResource.body.length).toBe(2);
            expect((newResource.body[1] as Message).attributes[0].id.name).toBe('new-attribute');
        });

        it('should be immutable', () => {
            // if the method is not immutable, the following would throw an "already exists" error
            resource.createMessage(Message.from({ id: 'new-message', value: 'new pattern' }).unwrap()).unwrap();
            resource.createMessage(Message.from({ id: 'new-message', value: 'new pattern' }).unwrap()).unwrap();
        });
    });
});

describe('get', () => {
    describe('Message()', () => {
        const resource = new Resource([
            Message.from({
                id: 'the-message',
                value: 'this is my test',
                attributes: [Attribute.from({ id: 'the-attribute', value: 'some text pattern' }).unwrap()],
            }).unwrap(),
        ]);
        it('should return the message', () => {
            expect(resource.getMessage({ id: 'the-message' })).toEqual(resource.body[0]);
        });

        it('should return undefined if a message does not exist', () => {
            expect(resource.getMessage({ id: 'none-existent' })).toBeUndefined();
        });
    });

    describe('Attribute()', () => {
        const resource = new Resource([
            Message.from({
                id: 'the-message',
                value: 'this is my test',
                attributes: [Attribute.from({ id: 'the-attribute', value: 'some text pattern' }).unwrap()],
            }).unwrap(),
        ]);
        it('should return the attribute', () => {
            expect(resource.getAttribute({ messageId: 'the-message', id: 'the-attribute' })).toEqual(
                (resource.body[0] as Message).attributes[0]
            );
        });

        it('should return undefined if the parent message does not exist', () => {
            expect(resource.getAttribute({ messageId: 'none-existent', id: 'the-attribute' })).toBeUndefined();
        });

        it('should return undefined if the parent message exists but the attribute itself does not', () => {
            expect(resource.getAttribute({ messageId: 'the-message', id: 'none-existent-attribute' })).toBeUndefined();
        });
    });
});

describe('update', () => {
    describe('Message()', () => {
        const resource = new Resource([
            Message.from({
                id: 'the-message',
                value: 'this is my test',
            }).unwrap(),
        ]);
        it('should update the value (pattern)', () => {
            const newResource = resource
                .updateMessage({
                    id: 'the-message',
                    with: Message.from({ id: 'the-message', value: 'updated text' }).unwrap(),
                })
                .unwrap();
            expect((newResource.body[0] as Message).value?.elements[0].value).toBe('updated text');
        });

        it('should update the attributes', () => {
            const newResource = resource
                .updateMessage({
                    id: 'the-message',
                    with: {
                        attributes: [Attribute.from({ id: 'the-attribute', value: 'the attribute text' }).unwrap()],
                    },
                })
                .unwrap();
            expect((newResource.body[0] as Message).attributes[0].value.elements[0].value).toBe('the attribute text');
        });

        it('should be immutable', () => {
            // if the method is not immutable, the following would throw an error
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _ = resource
                .updateMessage({
                    id: 'the-message',
                    with: Message.from({ id: 'the-message', value: 'hello' }).unwrap(),
                })
                .unwrap();
            expect((resource.body[0] as Message).value?.elements[0].value).toBe('this is my test');
        });
    });
    describe('Attribute()', () => {
        const resource = new Resource([
            Message.from({
                id: 'the-message',
                attributes: [Attribute.from({ id: 'the-attribute', value: 'some text pattern' }).unwrap()],
            }).unwrap(),
        ]);
        it('should update the value (pattern)', () => {
            const newResource = resource
                .updateAttribute({
                    messageId: 'the-message',
                    id: 'the-attribute',
                    with: Attribute.from({ id: 'the-attribute', value: 'updated text' }).unwrap(),
                })
                .unwrap();
            expect((newResource.body[0] as Message).attributes[0].value.elements[0].value).toBe('updated text');
        });

        it('should be immutable', () => {
            // if the method is not immutable, the following would throw an error
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _ = resource
                .updateAttribute({
                    messageId: 'the-message',
                    id: 'the-attribute',
                    with: Attribute.from({ id: 'the-attribute', value: 'updated text' }).unwrap(),
                })
                .unwrap();
            expect((resource.body[0] as Message).attributes[0].value.elements[0].value).toBe('some text pattern');
        });
    });
});

describe('delete', () => {
    describe('Message()', () => {
        const resource = new Resource([
            Message.from({
                id: 'the-message',
                value: 'this is my test',
                attributes: [Attribute.from({ id: 'the-attribute', value: 'some text pattern' }).unwrap()],
            }).unwrap(),
        ]);
        it('should delete the message', () => {
            const newResource = resource.deleteMessage({ id: 'the-message' }).unwrap();
            expect(newResource.body.length).toBe(0);
        });

        it('should be immutable', () => {
            // if the method is not immutable, the following would throw an error
            resource.deleteMessage({ id: 'the-message' }).unwrap();
            resource.deleteMessage({ id: 'the-message' }).unwrap();
        });
    });

    describe('Attribute()', () => {
        const resource = new Resource([
            Message.from({
                id: 'the-message',
                value: 'this is my test',
                attributes: [Attribute.from({ id: 'the-attribute', value: 'some text pattern' }).unwrap()],
            }).unwrap(),
        ]);
        it('should delete the attribute', () => {
            const newResource = resource.deleteAttribute({ messageId: 'the-message', id: 'the-attribute' }).unwrap();
            expect((newResource.body[0] as Message).attributes.length).toBe(0);
        });

        it('should be immutable', () => {
            // if the method is not immutable, the following would throw an error
            resource.deleteAttribute({ messageId: 'the-message', id: 'the-attribute' }).unwrap();
            resource.deleteAttribute({ messageId: 'the-message', id: 'the-attribute' }).unwrap();
        });
    });
});

describe('upsert', () => {
    describe('Attribute()', () => {
        const resource = new Resource([
            Message.from({
                id: 'the-message',
                value: 'this is my test',
                attributes: [Attribute.from({ id: 'the-attribute', value: 'some text pattern' }).unwrap()],
            }).unwrap(),
        ]);
        it('should update an existing attribute', () => {
            const newResource = resource
                .upsertAttribute({
                    attribute: Attribute.from({ id: 'the-attribute', value: 'some new text pattern' }).unwrap(),
                    messageId: 'the-message',
                })
                .unwrap();
            expect((newResource.body[0] as Message).attributes[0].value.elements[0].value).toEqual(
                'some new text pattern'
            );
        });

        it('should create a new message containing the attribute if the "parent message" does not exist', () => {
            const newResource = resource
                .upsertAttribute({
                    attribute: Attribute.from({ id: 'the-attribute', value: 'a pattern' }).unwrap(),
                    messageId: 'a-new-message',
                })
                .unwrap();
            expect((newResource.body[1] as Message).id.name).toEqual('a-new-message');
            expect((newResource.body[1] as Message).attributes[0].value.elements[0].value).toEqual('a pattern');
        });
    });
});
