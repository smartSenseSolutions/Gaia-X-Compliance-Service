module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  collectCoverage: true,
  collectCoverageFrom: ['**/*.{js,ts}'],
  coverageDirectory: '../coverage/unit',
  coverageReporters: ['lcov','cobertura','text'],
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setTestEnvVars.js'],
  transformIgnorePatterns: ['/node_modules/*', '<rootDir>/tests/setTestEnvVars.js']
}
