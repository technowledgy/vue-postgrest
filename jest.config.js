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
  setupFiles: [
    '<rootDir>/tests/setup.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setupAfterEnv.js'
  ],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
    url: 'http://localhost/nested/path'
  },
  testMatch: [
    '**/tests/unit/**/*.spec.js'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
}
