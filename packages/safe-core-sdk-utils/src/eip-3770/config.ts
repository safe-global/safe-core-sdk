interface NetworkShortName {
  shortName: string
  chainId: number
}

// https://github.com/ethereum-lists/chains/tree/master/_data/chains
export const networks: NetworkShortName[] = [
  { chainId: 1, shortName: 'eth' },
  { chainId: 3, shortName: 'rop' },
  { chainId: 4, shortName: 'rin' },
  { chainId: 5, shortName: 'gor' },
  { chainId: 10, shortName: 'oeth' },
  { chainId: 11, shortName: 'meta' },
  { chainId: 12, shortName: 'kal' },
  { chainId: 28, shortName: 'boba-rinkeby' },
  { chainId: 42, shortName: 'kov' },
  { chainId: 56, shortName: 'bnb' },
  { chainId: 69, shortName: 'okov' },
  { chainId: 82, shortName: 'meter' },
  { chainId: 83, shortName: 'meter-test' },
  { chainId: 100, shortName: 'gno' },
  { chainId: 106, shortName: 'vlx' },
  { chainId: 111, shortName: 'etl' },
  { chainId: 122, shortName: 'fuse' },
  { chainId: 123, shortName: 'spark' },
  { chainId: 137, shortName: 'matic' },
  { chainId: 246, shortName: 'ewt' },
  { chainId: 288, shortName: 'boba' },
  { chainId: 300, shortName: 'ogn' },
  { chainId: 588, shortName: 'metis-stardust' },
  { chainId: 1008, shortName: 'eun' },
  { chainId: 1088, shortName: 'metis-andromeda' },
  { chainId: 1284, shortName: 'mbeam' },
  { chainId: 1285, shortName: 'mriver' },
  { chainId: 1287, shortName: 'mbase' },
  { chainId: 1984, shortName: 'euntest' },
  { chainId: 4002, shortName: 'tftm' },
  { chainId: 7341, shortName: 'shyft' },
  { chainId: 9000, shortName: 'evmos-testnet' },
  { chainId: 9001, shortName: 'evmos' },
  { chainId: 11437, shortName: 'shyftt' },
  { chainId: 12357, shortName: 'rei-testnet' },
  { chainId: 42161, shortName: 'arb1' },
  { chainId: 42220, shortName: 'celo' },
  { chainId: 43114, shortName: 'avax' },
  { chainId: 47805, shortName: 'rei' },
  { chainId: 73799, shortName: 'vt' },
  { chainId: 80001, shortName: 'maticmum' },
  { chainId: 333999, shortName: 'olympus' },
  { chainId: 421611, shortName: 'arb-rinkeby' },
  { chainId: 1313161554, shortName: 'aurora' },
  { chainId: 1313161555, shortName: 'aurora-testnet' },
  { chainId: 1666600000, shortName: 'hmy-s0' },
  { chainId: 1666700000, shortName: 'hmy-b-s0' },
  { chainId: 11297108099, shortName: 'tpalm' },
  { chainId: 11297108109, shortName: 'palm' }
]

if (process.env.TEST_NETWORK === 'hardhat') {
  networks.push({ shortName: 'local', chainId: 31337 })
} else if (process.env.TEST_NETWORK === 'ganache') {
  networks.push({ shortName: 'local', chainId: 1337 })
}
