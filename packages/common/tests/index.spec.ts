import hello from '../src';

describe('Hello', () => {
    it('should return hello word', () => {
        expect(hello("world")).toBe('Hello world');
    });
});
