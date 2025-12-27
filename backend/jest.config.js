export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Only match files ending in .test.js in __tests__ directories
  testMatch: ['**/__tests__/**/*.test.js'],
  // Explicitly ignore setup and helper files - these are utility files, not test files
  // Match the full paths that Jest discovers
  testPathIgnorePatterns: [
    '/node_modules/',
    '.*/__tests__/setup\\.js$',
    '.*/__tests__/helpers\\.js$',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js', // Exclude main entry point from coverage
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: [
    '<rootDir>/src/__testUtils__/setup.js',
  ],
  testTimeout: 10000,
};

