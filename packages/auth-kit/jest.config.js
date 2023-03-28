/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  roots: ['<rootDir>/src'],
  verbose: true,
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  }
}

module.exports = config
