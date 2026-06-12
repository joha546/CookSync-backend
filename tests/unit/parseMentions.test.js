const { parseMentionUsernames } = require('../../utils/parseMentions');

describe('parseMentionUsernames', () => {
    it('returns empty array when message has no mentions', () => {
        expect(parseMentionUsernames('hello world')).toEqual([]);
    });

    it('extracts lowercase usernames without @ prefix', () => {
        expect(parseMentionUsernames('Hey @Alice and @bob.test')).toEqual([
            'alice',
            'bob.test',
        ]);
    });

    it('returns empty array for empty message', () => {
        expect(parseMentionUsernames('')).toEqual([]);
    });
});
