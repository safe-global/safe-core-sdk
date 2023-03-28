const config = {
  roots: ['<rootDir>/src'],
  verbose: true,
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1'
  }
}

module.exports = config
