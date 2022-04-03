import * as fluent from '@fluent/syntax';
import { Message } from './message';
import { Resource } from './resource';

describe('includes()', () => {
    const resource = new Resource([
        new fluent.Message(
            new fluent.Identifier('the-message'),
            new fluent.Pattern([new fluent.TextElement('this is my test')]),
            [
                new fluent.Attribute(
                    new fluent.Identifier('the-attribute'),
                    new fluent.Pattern([new fluent.TextElement('some text pattern')])
                ),
            ]
        ),
    ]);
    it('should be truthy when a message exists', () => {
        expect(resource.includes({ message: { id: 'the-message' } })).toBeTruthy();
    });

    it('should be falsy when a message does not exist', () => {
        expect(resource.includes({ message: { id: 'none-existent' } })).toBeFalsy();
    });

    it('should be truthy when an attribute exists', () => {
        expect(resource.includes({ message: { id: 'the-message' }, attribute: { id: 'the-attribute' } })).toBeTruthy();
    });

    it('should be falsy if the message holding the attribute does not exists', () => {
        expect(resource.includes({ message: { id: 'none-existent' }, attribute: { id: 'the-attribute' } })).toBeFalsy();
    });
});

describe('get()', () => {
    const resource = new Resource([
        new fluent.Message(
            new fluent.Identifier('the-message'),
            new fluent.Pattern([new fluent.TextElement('this is my test')]),
            [
                new fluent.Attribute(
                    new fluent.Identifier('the-attribute'),
                    new fluent.Pattern([new fluent.TextElement('some text pattern')])
                ),
            ]
        ),
    ]);
    it('should return the message', () => {
        expect(resource.get({ message: { id: 'the-message' } })).toEqual(resource.body[0]);
    });

    it('should return the attribute', () => {
        expect(resource.get({ message: { id: 'the-message' }, attribute: { id: 'the-attribute' } })).toEqual(
            (resource.body[0] as Message).attributes[0]
        );
    });

    it('should return undefined if a message does not exist', () => {
        expect(resource.get({ message: { id: 'none-existent' } })).toBeUndefined();
    });
});

describe('create()', () => {
    const resource = new Resource([
        new fluent.Message(
            new fluent.Identifier('first-message'),
            new fluent.Pattern([new fluent.TextElement('this is my test')])
        ),
    ]);

    it('should create a new message with no attributes', () => {
        const newResource = resource
            .create({ message: { id: 'new-message', value: 'new pattern', attributes: [] } })
            .unwrap();
        expect(newResource.body.length).toBe(2);
        expect((newResource.body[1] as Message).id.name).toBe('new-message');
    });

    it('should create a new message with attributes', () => {
        const newResource = resource
            .create({
                message: {
                    id: 'new-message',
                    value: 'new pattern',
                    attributes: [{ id: 'new-attribute', value: 'some pattern' }],
                },
            })
            .unwrap();
        expect(newResource.body.length).toBe(2);
        expect((newResource.body[1] as Message).attributes[0].id.name).toBe('new-attribute');
    });

    it('should be immutable', () => {
        // if the method would be immutable, the following would throw an "already exists" error
        resource.create({ message: { id: 'new-message', value: 'new pattern' } }).unwrap();
        resource.create({ message: { id: 'new-message', value: 'new pattern' } }).unwrap();
    });

    // it('should return the attribute', () => {
    //     expect(resource.get({ message: { id: 'the-message' }, attribute: { id: 'the-attribute' } })).toEqual(
    //         (resource.body[0] as Message).attributes[0]
    //     );
    // });

    // it('should return undefined if a message does not exist', () => {
    //     expect(resource.get({ message: { id: 'none-existent' } })).toBeUndefined();
    // });
});
