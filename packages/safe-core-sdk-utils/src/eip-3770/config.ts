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
  { chainId: 25, shortName: 'cro' },
  { chainId: 28, shortName: 'bobarinkeby' },
  { chainId: 40, shortName: 'telosevm' },
  { chainId: 41, shortName: 'telosevmtestnet' },
  { chainId: 42, shortName: 'kov' },
  { chainId: 50, shortName: 'xdc' },
  { chainId: 51, shortName: 'txdc' },
  { chainId: 56, shortName: 'bnb' },
  { chainId: 61, shortName: 'etc' },
  { chainId: 63, shortName: 'metc' },
  { chainId: 69, shortName: 'okov' },
  { chainId: 82, shortName: 'meter' },
  { chainId: 83, shortName: 'meter-test' },
  { chainId: 97, shortName: 'bnbt' },
  { chainId: 100, shortName: 'gno' },
  { chainId: 106, shortName: 'vlx' },
  { chainId: 108, shortName: 'tt' },
  { chainId: 111, shortName: 'etl' },
  { chainId: 122, shortName: 'fuse' },
  { chainId: 123, shortName: 'spark' },
  { chainId: 137, shortName: 'matic' },
  { chainId: 246, shortName: 'ewt' },
  { chainId: 250, shortName: 'ftm' },
  { chainId: 288, shortName: 'boba' },
  { chainId: 300, shortName: 'ogn' },
  { chainId: 321, shortName: 'kcs' },
  { chainId: 322, shortName: 'kcst' },
  { chainId: 336, shortName: 'sdn' },
  { chainId: 338, shortName: 'tcro' },
  { chainId: 420, shortName: 'ogor' },
  { chainId: 588, shortName: 'metis-stardust' },
  { chainId: 592, shortName: 'astr' },
  { chainId: 595, shortName: 'maca' },
  { chainId: 599, shortName: 'metis-goerli' },
  { chainId: 686, shortName: 'kar' },
  { chainId: 787, shortName: 'aca' },
  { chainId: 1001, shortName: 'baobab' },
  { chainId: 1008, shortName: 'eun' },
  { chainId: 1088, shortName: 'metis-andromeda' },
  { chainId: 1284, shortName: 'mbeam' },
  { chainId: 1285, shortName: 'mriver' },
  { chainId: 1287, shortName: 'mbase' },
  { chainId: 1294, shortName: 'bobabeam' },
  { chainId: 1807, shortName: 'rana' },
  { chainId: 1984, shortName: 'euntest' },
  { chainId: 2001, shortName: 'milkada' },
  { chainId: 2002, shortName: 'milkalgo' },
  { chainId: 2008, shortName: 'cloudwalk_testnet' },
  { chainId: 2019, shortName: 'pmint_test' },
  { chainId: 2020, shortName: 'pmint' },
  { chainId: 2221, shortName: 'tkava' },
  { chainId: 2222, shortName: 'kava' },
  { chainId: 4002, shortName: 'tftm' },
  { chainId: 4689, shortName: 'iotex-mainnet' },
  { chainId: 4918, shortName: 'txvm' },
  { chainId: 4919, shortName: 'xvm' },
  { chainId: 7341, shortName: 'shyft' },
  { chainId: 7700, shortName: 'canto' },
  { chainId: 8217, shortName: 'cypress' },
  { chainId: 9000, shortName: 'evmos-testnet' },
  { chainId: 9001, shortName: 'evmos' },
  { chainId: 9728, shortName: 'boba-testnet' },
  { chainId: 10000, shortName: 'smartbch' },
  { chainId: 10001, shortName: 'smartbchtest' },
  { chainId: 10200, shortName: 'chi' },
  { chainId: 11235, shortName: 'islm' },
  { chainId: 11437, shortName: 'shyftt' },
  { chainId: 12357, shortName: 'rei-testnet' },
  { chainId: 42161, shortName: 'arb1' },
  { chainId: 42170, shortName: 'arb-nova' },
  { chainId: 42220, shortName: 'celo' },
  { chainId: 43113, shortName: 'fuji' },
  { chainId: 43114, shortName: 'avax' },
  { chainId: 43288, shortName: 'boba-avax' },
  { chainId: 44787, shortName: 'alfa' },
  { chainId: 45000, shortName: 'autobahnnetwork' },
  { chainId: 47805, shortName: 'rei' },
  { chainId: 54211, shortName: 'islmt' },
  { chainId: 56288, shortName: 'boba-bnb' },
  { chainId: 71401, shortName: 'gw-testnet-v1' },
  { chainId: 71402, shortName: 'gw-mainnet-v1' },
  { chainId: 73799, shortName: 'vt' },
  { chainId: 80001, shortName: 'maticmum' },
  { chainId: 84531, shortName: 'base-gor' },
  { chainId: 200101, shortName: 'milktada' },
  { chainId: 200202, shortName: 'milktalgo' },
  { chainId: 333999, shortName: 'olympus' },
  { chainId: 421611, shortName: 'arb-rinkeby' },
  { chainId: 421613, shortName: 'arb-goerli' },
  { chainId: 11155111, shortName: 'sep' },
  { chainId: 1313161554, shortName: 'aurora' },
  { chainId: 1313161555, shortName: 'aurora-testnet' },
  { chainId: 1666600000, shortName: 'hmy-s0' },
  { chainId: 1666700000, shortName: 'hmy-b-s0' },
  { chainId: 11297108099, shortName: 'tpalm' },
  { chainId: 11297108109, shortName: 'palm' },
]

if (process.env.TEST_NETWORK === 'hardhat') {
  networks.push({ shortName: 'local', chainId: 31337 })
} else if (process.env.TEST_NETWORK === 'ganache') {
  networks.push({ shortName: 'local', chainId: 1337 })
}
