const config = {
  roots: ['<rootDir>/src'],
  verbose: true,
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@safe-global/protocol-kit/typechain/(.*)$': '<rootDir>/../protocol-kit/typechain/$1',
    '^@safe-global/protocol-kit/(.*)$': '<rootDir>/../protocol-kit/src/$1',
    '^@safe-global/relay-kit/(.*)$': '<rootDir>/src/$1'
  }
}

module.exports = config
