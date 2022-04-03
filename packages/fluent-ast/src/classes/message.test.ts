import { Attribute } from './attribute';
import { Message } from './message';

describe('from()', () => {
    it('should return a new message', () => {
        const message = Message.from({
            id: 'the-message',
            value: 'this is my test',
        }).unwrap();
        expect(message.id.name).toBe('the-message');
    });

    it('should fail if a malformatted pattern is provided', () => {
        const result = Message.from({
            id: 'the-message',
            value: 'iangoithis is ${ my test',
        });
        expect(result.isErr).toBe(true);
    });

    it('pattern should be optional', () => {
        const result = Message.from({
            id: 'the-message',
        });
        expect(result.isOk).toBe(true);
    });

    it('should create a new message with attributes', () => {
        const message = Message.from({
            id: 'new-message',
            value: 'new pattern',
            attributes: [Attribute.from({ id: 'new-attribute', value: 'some pattern' }).unwrap()],
        }).unwrap();
        expect(message.attributes[0].id.name).toBe('new-attribute');
    });
});
