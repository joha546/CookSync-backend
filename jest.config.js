module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./jest.setup.js'],
    testPathIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/tests/**/*.test.js'],
    verbose: true
}