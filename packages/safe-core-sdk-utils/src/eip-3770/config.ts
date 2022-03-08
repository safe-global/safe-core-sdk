
interface NetworkShortName {
  shortName: string
  chainId: number
}

export const networks: NetworkShortName[] = [
  { shortName: 'eth', chainId: 1 },
  { shortName: 'rop', chainId: 3 },
  { shortName: 'rin', chainId: 4 },
  { shortName: 'gor', chainId: 5 },
  { shortName: 'oeth', chainId: 10 },
  { shortName: 'meta', chainId: 11 },
  { shortName: 'kal', chainId: 12 },
  { shortName: 'boba-rinkeby', chainId: 28 },
  { shortName: 'kov', chainId: 42 },
  { shortName: 'bnb', chainId: 56 },
  { shortName: 'okov', chainId: 69 },
  { shortName: 'gno', chainId: 100 },
  { shortName: 'fuse', chainId: 122 },
  { shortName: 'spark', chainId: 123 },
  { shortName: 'matic', chainId: 137 },
  { shortName: 'ewt', chainId: 246 },
  { shortName: 'boba', chainId: 288 },
  { shortName: 'metis-stardust', chainId: 588 },
  { shortName: 'metis-andromeda', chainId: 1088 },
  { shortName: 'mbeam', chainId: 1284 },
  { shortName: 'mriver', chainId: 1285 },
  { shortName: 'mbase', chainId: 1287 },
  { shortName: 'tftm', chainId: 4002 },
  { shortName: 'arb1', chainId: 42161 },
  { shortName: 'celo', chainId: 42220 },
  { shortName: 'avax', chainId: 43114 },
  { shortName: 'vt', chainId: 73799 },
  { shortName: 'maticmum', chainId: 80001 },
  { shortName: 'olympus', chainId: 333999 },
  { shortName: 'aurora', chainId: 1313161554 },
  { shortName: 'aurora-testnet', chainId: 1313161555 }
]

if (process.env.TEST_NETWORK === 'hardhat') {
  networks.push({ shortName: 'local', chainId: 31337 })
} else if (process.env.TEST_NETWORK === 'ganache') {
  networks.push({ shortName: 'local', chainId: 1337 })
}
