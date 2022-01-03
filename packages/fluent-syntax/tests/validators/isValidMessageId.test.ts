import { isValidMessageId } from '../../src/validators/isValidMessageId';

describe('isValidMessageId()', () => {
    it('should accept snake_case', () => {
        expect(isValidMessageId('hello_world')).toBeTruthy();
    });
    it('should accept kebap-case', () => {
        expect(isValidMessageId('hello-world')).toBeTruthy();
    });

    it('should accept camelCase', () => {
        expect(isValidMessageId('helloWorld')).toBeTruthy();
    });
    it('should reject `-` prefixed ids', () => {
        // that would be a term id
        expect(isValidMessageId('-hello')).toBeFalsy();
    });
    it('should reject whitespace', () => {
        expect(isValidMessageId('hello- world')).toBeFalsy();
    });

    it('should reject dot.notation', () => {
        expect(isValidMessageId('hello.world')).toBeFalsy();
    });
});
