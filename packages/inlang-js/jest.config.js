const config = {
    verbose: true,
    transform: {
        '^.+\\.ts$': 'ts-jest',
        '\\.m?jsx?$': 'jest-esm-transformer',
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}

module.exports = config
