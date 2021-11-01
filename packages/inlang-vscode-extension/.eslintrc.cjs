module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
    ],
    plugins: ['@typescript-eslint'],
    ignorePatterns: ['*.cjs'],
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2019,
    },
    env: {
        browser: true,
        es2017: true,
        node: true,
    },
}
