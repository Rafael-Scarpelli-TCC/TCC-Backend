export default {
  testEnvironment: 'node',
  transform: {},
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup/env.js'],
  testTimeout: 60000,
  coverageProvider: 'v8',
  collectCoverageFrom: ['src/controllers/SolicitacaoController.js'],
  coverageDirectory: 'coverage',
};