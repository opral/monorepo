import { isValidId } from '../../src/utils/isValidId';

describe('isValidId()', () => {
    it('should accept a message id', () => expect(isValidId('hello')).toBeTruthy());

    it('should accept a dot notation attribute id', () => expect(isValidId('hello.world')).toBeTruthy());

    it('should reject more than one layer of attributes', () => expect(isValidId('hello.world.nested')).toBeFalsy());
});
