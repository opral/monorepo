import { isValidMessageId } from '../../src/utils/isValidMessageId';

describe('isValidMessageId()', () => {
    it('should reject an empty string', () => expect(isValidMessageId('')).toBeFalsy());
    it('should accept snake_case', () => {
        expect(isValidMessageId('hello_world')).toBeTruthy();
    });
    it('should accept kebap-case', () => {
        expect(isValidMessageId('hello-world')).toBeTruthy();
    });

    it('should accept camelCase', () => {
        expect(isValidMessageId('helloWorld')).toBeTruthy();
    });

    it('should accept PascalCase', () => {
        expect(isValidMessageId('HelloWorld')).toBeTruthy();
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
