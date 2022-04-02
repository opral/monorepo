export default {
  preset: 'ts-jest/presets/default-esm',
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/test/'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
};
