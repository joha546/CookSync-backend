function parseMentionUsernames(message) {
    const mentions = message.match(/@([a-zA-Z0-9._-]+)/g);
    if (!mentions) {
        return [];
    }
    return mentions.map((m) => m.slice(1).toLowerCase());
}

module.exports = { parseMentionUsernames };
