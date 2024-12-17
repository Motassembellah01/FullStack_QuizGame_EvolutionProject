import { CHAR_SETS } from '@app/core/constants/constants';
import { KeyGenerator } from './key-generator';

describe('KeyGenerator', () => {
    let keyGenerator: KeyGenerator;

    beforeEach(() => {
        keyGenerator = new KeyGenerator();
    });

    it('should create an instance', () => {
        expect(new KeyGenerator()).toBeTruthy();
    });
    it('should generate a key with the specified length and characters', () => {
        const length = 10;

        const key = keyGenerator.generateKey(CHAR_SETS.id, length);

        expect(key.length).toBe(length);
        for (let i = 0; i < length; i++) {
            expect(CHAR_SETS.id.includes(key[i])).toBe(true);
        }
    });

    it('should return an empty string if length is 0', () => {
        const length = 0;

        const key = keyGenerator.generateKey(CHAR_SETS.id, length);

        expect(key).toBe('');
    });
});
