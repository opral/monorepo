import { Attribute } from './attribute';
import { Message } from './message';
import { Resource } from './resource';

describe('includes()', () => {
    const resource = new Resource([
        Message.from({
            id: 'the-message',
            value: 'this is my test',
            attributes: [Attribute.from({ id: 'the-attribute', value: 'some text pattern' }).unwrap()],
        }).unwrap(),
    ]);
    describe('message:', () => {
        it('should be truthy when a message exists', () => {
            expect(resource.includes({ message: { id: 'the-message' } })).toBeTruthy();
        });

        it('should be falsy when a message does not exist', () => {
            expect(resource.includes({ message: { id: 'none-existent' } })).toBeFalsy();
        });
    });

    describe('attribute', () => {
        it('should be truthy when an attribute exists', () => {
            expect(resource.includes({ attribute: { messageId: 'the-message', id: 'the-attribute' } })).toBeTruthy();
        });

        it('should be falsy if the message holding the attribute does not exists', () => {
            expect(resource.includes({ attribute: { messageId: 'none-existent', id: 'the-attribute' } })).toBeFalsy();
        });
    });
});

describe('create()', () => {
    describe('message:', () => {
        const resource = new Resource([Message.from({ id: 'first-message', value: 'this is my test' }).unwrap()]);
        it('should create a new message with no attributes', () => {
            const newResource = resource
                .create({ message: Message.from({ id: 'new-message', value: 'new pattern', attributes: [] }).unwrap() })
                .unwrap();
            expect(newResource.body.length).toBe(2);
            expect((newResource.body[1] as Message).id.name).toBe('new-message');
        });

        it('should create a new message with attributes', () => {
            const newResource = resource
                .create({
                    message: Message.from({
                        id: 'new-message',
                        value: 'new pattern',
                        attributes: [Attribute.from({ id: 'new-attribute', value: 'some pattern' }).unwrap()],
                    }).unwrap(),
                })
                .unwrap();
            expect(newResource.body.length).toBe(2);
            expect((newResource.body[1] as Message).attributes[0].id.name).toBe('new-attribute');
        });

        it('should be immutable', () => {
            // if the method is not immutable, the following would throw an "already exists" error
            resource.create({ message: Message.from({ id: 'new-message', value: 'new pattern' }).unwrap() }).unwrap();
            resource.create({ message: Message.from({ id: 'new-message', value: 'new pattern' }).unwrap() }).unwrap();
        });
    });
});

describe('get()', () => {
    describe('message:', () => {
        const resource = new Resource([
            Message.from({
                id: 'the-message',
                value: 'this is my test',
                attributes: [Attribute.from({ id: 'the-attribute', value: 'some text pattern' }).unwrap()],
            }).unwrap(),
        ]);
        it('should return the message', () => {
            expect(resource.get({ message: { id: 'the-message' } })).toEqual(resource.body[0]);
        });

        it('should return undefined if a message does not exist', () => {
            expect(resource.get({ message: { id: 'none-existent' } })).toBeUndefined();
        });
    });
});

describe('update()', () => {
    describe('message:', () => {
        const resource = new Resource([
            Message.from({
                id: 'the-message',
                value: 'this is my test',
            }).unwrap(),
        ]);
        it('should update the value (pattern)', () => {
            const newResource = resource
                .update({
                    message: {
                        id: 'the-message',
                        with: Message.from({ id: 'the-message', value: 'updated text' }).unwrap(),
                    },
                })
                .unwrap();
            expect((newResource.body[0] as Message).value?.elements[0].value).toBe('updated text');
        });

        it('should update the attributes', () => {
            const newResource = resource
                .update({
                    message: {
                        id: 'the-message',
                        with: {
                            attributes: [Attribute.from({ id: 'the-attribute', value: 'the attribute text' }).unwrap()],
                        },
                    },
                })
                .unwrap();
            expect((newResource.body[0] as Message).attributes[0].value.elements[0].value).toBe('the attribute text');
        });

        it('should be immutable', () => {
            // if the method is not immutable, the following would throw an error
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _ = resource
                .update({
                    message: { id: 'the-message', with: Message.from({ id: 'the-message', value: 'hello' }).unwrap() },
                })
                .unwrap();
            expect((resource.body[0] as Message).value?.elements[0].value).toBe('this is my test');
        });
    });
    describe('attribute:', () => {
        const resource = new Resource([
            Message.from({
                id: 'the-message',
                attributes: [Attribute.from({ id: 'the-attribute', value: 'some text pattern' }).unwrap()],
            }).unwrap(),
        ]);
        it('should update the value (pattern)', () => {
            const newResource = resource
                .update({
                    attribute: {
                        messageId: 'the-message',
                        id: 'the-attribute',
                        with: Attribute.from({ id: 'the-attribute', value: 'updated text' }).unwrap(),
                    },
                })
                .unwrap();
            expect((newResource.body[0] as Message).attributes[0].value.elements[0].value).toBe('updated text');
        });

        it('should be immutable', () => {
            // if the method is not immutable, the following would throw an error
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _ = resource
                .update({
                    attribute: {
                        messageId: 'the-message',
                        id: 'the-attribute',
                        with: Attribute.from({ id: 'the-attribute', value: 'updated text' }).unwrap(),
                    },
                })
                .unwrap();
            expect((resource.body[0] as Message).attributes[0].value.elements[0].value).toBe('some text pattern');
        });
    });
});

describe('delete()', () => {
    describe('message:', () => {
        const resource = new Resource([
            Message.from({
                id: 'the-message',
                value: 'this is my test',
                attributes: [Attribute.from({ id: 'the-attribute', value: 'some text pattern' }).unwrap()],
            }).unwrap(),
        ]);
        it('should delete the message', () => {
            const newResource = resource.delete({ message: { id: 'the-message' } }).unwrap();
            expect(newResource.body.length).toBe(0);
        });

        it('should be immutable', () => {
            // if the method is not immutable, the following would throw an error
            resource.delete({ message: { id: 'the-message' } }).unwrap();
            resource.delete({ message: { id: 'the-message' } }).unwrap();
        });
    });

    describe('attribute:', () => {
        const resource = new Resource([
            Message.from({
                id: 'the-message',
                value: 'this is my test',
                attributes: [Attribute.from({ id: 'the-attribute', value: 'some text pattern' }).unwrap()],
            }).unwrap(),
        ]);
        it('should delete the attribute', () => {
            const newResource = resource
                .delete({ attribute: { messageId: 'the-message', id: 'the-attribute' } })
                .unwrap();
            expect((newResource.body[0] as Message).attributes.length).toBe(0);
        });

        it('should be immutable', () => {
            // if the method is not immutable, the following would throw an error
            resource.delete({ attribute: { messageId: 'the-message', id: 'the-attribute' } }).unwrap();
            resource.delete({ attribute: { messageId: 'the-message', id: 'the-attribute' } }).unwrap();
        });
    });
});
