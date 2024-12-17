export class KeyGenerator {
    generateKey(charset: string, length: number): string {
        let result = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            result += charset.charAt(randomIndex);
        }
        return result;
    }
}
