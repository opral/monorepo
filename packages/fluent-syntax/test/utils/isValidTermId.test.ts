import { isValidTermId } from '../../src/utils/isValidTermId';

describe('isValidTermId()', () => {
    it('should accept `-` prefixed message ids', () => {
        expect(isValidTermId('-hello')).toBeTruthy();
    });
    it('should reject non `-` prefixed ids', () => {
        // that would be a message id
        expect(isValidTermId('hello')).toBeFalsy();
    });

    it('should reject more than one `-` prefixed ids', () => {
        expect(isValidTermId('--hello')).toBeFalsy();
        expect(isValidTermId('-----hello')).toBeFalsy();
    });
});
