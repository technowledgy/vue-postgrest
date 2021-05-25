export default {
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**'
  ],
  coverageReporters: [
    'lcov',
    'text-summary'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  testEnvironment: 'jsdom',
  testMatch: [
    '**/tests/unit/**/*.spec.js'
  ],
  testURL: 'http://localhost/nested/path',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
}
