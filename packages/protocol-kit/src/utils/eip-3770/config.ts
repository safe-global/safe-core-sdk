interface NetworkShortName {
  shortName: string
  chainId: bigint
}

// https://github.com/ethereum-lists/chains/tree/master/_data/chains
export const networks: NetworkShortName[] = [
  { chainId: 1n, shortName: 'eth' },
  { chainId: 3n, shortName: 'rop' },
  { chainId: 4n, shortName: 'rin' },
  { chainId: 5n, shortName: 'gor' },
  { chainId: 10n, shortName: 'oeth' },
  { chainId: 11n, shortName: 'meta' },
  { chainId: 12n, shortName: 'kal' },
  { chainId: 18n, shortName: 'tst' },
  { chainId: 25n, shortName: 'cro' },
  { chainId: 28n, shortName: 'bobarinkeby' },
  { chainId: 30n, shortName: 'rsk' },
  { chainId: 31n, shortName: 'trsk' },
  { chainId: 39n, shortName: 'u2u' },
  { chainId: 40n, shortName: 'telosevm' },
  { chainId: 41n, shortName: 'telosevmtestnet' },
  { chainId: 42n, shortName: 'kov' },
  { chainId: 44n, shortName: 'crab' },
  { chainId: 46n, shortName: 'darwinia' },
  { chainId: 50n, shortName: 'xdc' },
  { chainId: 51n, shortName: 'txdc' },
  { chainId: 56n, shortName: 'bnb' },
  { chainId: 57n, shortName: 'sys' },
  { chainId: 61n, shortName: 'etc' },
  { chainId: 63n, shortName: 'metc' },
  { chainId: 69n, shortName: 'okov' },
  { chainId: 71n, shortName: 'cfxtest' },
  { chainId: 81n, shortName: 'joc' },
  { chainId: 82n, shortName: 'meter' },
  { chainId: 83n, shortName: 'meter-test' },
  { chainId: 88n, shortName: 'tomo' },
  { chainId: 97n, shortName: 'bnbt' },
  { chainId: 100n, shortName: 'gno' },
  { chainId: 106n, shortName: 'vlx' },
  { chainId: 108n, shortName: 'tt' },
  { chainId: 111n, shortName: 'etl' },
  { chainId: 122n, shortName: 'fuse' },
  { chainId: 123n, shortName: 'spark' },
  { chainId: 137n, shortName: 'matic' },
  { chainId: 148n, shortName: 'shimmerevm-mainnet' },
  { chainId: 155n, shortName: 'tenet-testnet' },
  { chainId: 169n, shortName: 'manta' },
  { chainId: 204n, shortName: 'opbnb' },
  { chainId: 246n, shortName: 'ewt' },
  { chainId: 250n, shortName: 'ftm' },
  { chainId: 255n, shortName: 'kroma' },
  { chainId: 280n, shortName: 'zksync-goerli' },
  { chainId: 288n, shortName: 'boba' },
  { chainId: 291n, shortName: 'orderly' },
  { chainId: 300n, shortName: 'ogn' },
  { chainId: 321n, shortName: 'kcs' },
  { chainId: 322n, shortName: 'kcst' },
  { chainId: 324n, shortName: 'zksync' },
  { chainId: 336n, shortName: 'sdn' },
  { chainId: 338n, shortName: 'tcro' },
  { chainId: 420n, shortName: 'ogor' },
  { chainId: 424n, shortName: 'PNG' },
  { chainId: 570n, shortName: 'sys-rollux' },
  { chainId: 588n, shortName: 'metis-stardust' },
  { chainId: 592n, shortName: 'astr' },
  { chainId: 595n, shortName: 'maca' },
  { chainId: 599n, shortName: 'metis-goerli' },
  { chainId: 686n, shortName: 'kar' },
  { chainId: 787n, shortName: 'aca' },
  { chainId: 919n, shortName: 'mode-testnet' },
  { chainId: 1001n, shortName: 'baobab' },
  { chainId: 1008n, shortName: 'eun' },
  { chainId: 1030n, shortName: 'cfx' },
  { chainId: 1088n, shortName: 'metis-andromeda' },
  { chainId: 1101n, shortName: 'zkevm' },
  { chainId: 1111n, shortName: 'wemix' },
  { chainId: 1112n, shortName: 'twemix' },
  { chainId: 1115n, shortName: 'tcore' },
  { chainId: 1116n, shortName: 'core' },
  { chainId: 1230n, shortName: 'UltronTestnet' },
  { chainId: 1231n, shortName: 'UltronMainnet' },
  { chainId: 1284n, shortName: 'mbeam' },
  { chainId: 1285n, shortName: 'mriver' },
  { chainId: 1287n, shortName: 'mbase' },
  { chainId: 1294n, shortName: 'bobabeam' },
  { chainId: 1442n, shortName: 'testnet-zkEVM-mango' },
  { chainId: 1559n, shortName: 'tenet' },
  { chainId: 1663n, shortName: 'Gobi' },
  { chainId: 1807n, shortName: 'rana' },
  { chainId: 1890n, shortName: 'lightlink_phoenix' },
  { chainId: 1891n, shortName: 'lightlink_pegasus' },
  { chainId: 1984n, shortName: 'euntest' },
  { chainId: 2001n, shortName: 'milkada' },
  { chainId: 2002n, shortName: 'milkalgo' },
  { chainId: 2008n, shortName: 'cloudwalk_testnet' },
  { chainId: 2019n, shortName: 'pmint_test' },
  { chainId: 2020n, shortName: 'pmint' },
  { chainId: 2021n, shortName: 'edg' },
  { chainId: 2221n, shortName: 'tkava' },
  { chainId: 2222n, shortName: 'kava' },
  { chainId: 2358n, shortName: 'kroma-sepolia' },
  { chainId: 3737n, shortName: 'csb' },
  { chainId: 4002n, shortName: 'tftm' },
  { chainId: 4337n, shortName: 'beam' },
  { chainId: 4460n, shortName: 'orderlyl2' },
  { chainId: 4689n, shortName: 'iotex-mainnet' },
  { chainId: 4918n, shortName: 'txvm' },
  { chainId: 4919n, shortName: 'xvm' },
  { chainId: 5000n, shortName: 'mantle' },
  { chainId: 5001n, shortName: 'mantle-testnet' },
  { chainId: 5700n, shortName: 'tsys' },
  { chainId: 6102n, shortName: 'cascadia' },
  { chainId: 7001n, shortName: 'zetachain-athens' },
  { chainId: 7332n, shortName: 'EON' },
  { chainId: 7341n, shortName: 'shyft' },
  { chainId: 7700n, shortName: 'canto' },
  { chainId: 8192n, shortName: 'tqf' },
  { chainId: 8194n, shortName: 'ttqf' },
  { chainId: 8217n, shortName: 'cypress' },
  { chainId: 8453n, shortName: 'base' },
  { chainId: 9000n, shortName: 'evmos-testnet' },
  { chainId: 9001n, shortName: 'evmos' },
  { chainId: 9728n, shortName: 'boba-testnet' },
  { chainId: 10000n, shortName: 'smartbch' },
  { chainId: 10001n, shortName: 'smartbchtest' },
  { chainId: 10081n, shortName: 'joct' },
  { chainId: 10200n, shortName: 'chi' },
  { chainId: 10243n, shortName: 'aa' },
  { chainId: 11235n, shortName: 'islm' },
  { chainId: 11437n, shortName: 'shyftt' },
  { chainId: 11891n, shortName: 'Arianee' },
  { chainId: 12357n, shortName: 'rei-testnet' },
  { chainId: 13337n, shortName: 'beam-testnet' },
  { chainId: 17000n, shortName: 'holesky' },
  { chainId: 23294n, shortName: 'sapphire' },
  { chainId: 23295n, shortName: 'sapphire-testnet' },
  { chainId: 34443n, shortName: 'mode' },
  { chainId: 42161n, shortName: 'arb1' },
  { chainId: 42170n, shortName: 'arb-nova' },
  { chainId: 42220n, shortName: 'celo' },
  { chainId: 43113n, shortName: 'fuji' },
  { chainId: 43114n, shortName: 'avax' },
  { chainId: 43288n, shortName: 'boba-avax' },
  { chainId: 44787n, shortName: 'alfa' },
  { chainId: 45000n, shortName: 'autobahnnetwork' },
  { chainId: 47805n, shortName: 'rei' },
  { chainId: 54211n, shortName: 'islmt' },
  { chainId: 56288n, shortName: 'boba-bnb' },
  { chainId: 57000n, shortName: 'tsys-rollux' },
  { chainId: 58008n, shortName: 'sepPNG' },
  { chainId: 59140n, shortName: 'linea-testnet' },
  { chainId: 59144n, shortName: 'linea' },
  { chainId: 71401n, shortName: 'gw-testnet-v1' },
  { chainId: 71402n, shortName: 'gw-mainnet-v1' },
  { chainId: 73799n, shortName: 'vt' },
  { chainId: 80001n, shortName: 'maticmum' },
  { chainId: 84531n, shortName: 'basegor' },
  { chainId: 84532n, shortName: 'basesep' },
  { chainId: 200101n, shortName: 'milktada' },
  { chainId: 200202n, shortName: 'milktalgo' },
  { chainId: 333999n, shortName: 'olympus' },
  { chainId: 421611n, shortName: 'arb-rinkeby' },
  { chainId: 421613n, shortName: 'arb-goerli' },
  { chainId: 421614n, shortName: 'arb-sep' },
  { chainId: 534351n, shortName: 'scr-sepolia' },
  { chainId: 534352n, shortName: 'scr' },
  { chainId: 534353n, shortName: 'scr-alpha' },
  { chainId: 622277n, shortName: 'rth' },
  { chainId: 7777777n, shortName: 'zora' },
  { chainId: 11155111n, shortName: 'sep' },
  { chainId: 222000222n, shortName: 'kanazawa' },
  { chainId: 245022926n, shortName: 'neonevm-devnet' },
  { chainId: 245022934n, shortName: 'neonevm-mainnet' },
  { chainId: 333000333n, shortName: 'meld' },
  { chainId: 1313161554n, shortName: 'aurora' },
  { chainId: 1313161555n, shortName: 'aurora-testnet' },
  { chainId: 1666600000n, shortName: 'hmy-s0' },
  { chainId: 1666700000n, shortName: 'hmy-b-s0' },
  { chainId: 11297108099n, shortName: 'tpalm' },
  { chainId: 11297108109n, shortName: 'palm' }
]

if (process.env.TEST_NETWORK === 'hardhat') {
  networks.push({ shortName: 'local', chainId: 31337n })
} else if (process.env.TEST_NETWORK === 'ganache') {
  networks.push({ shortName: 'local', chainId: 1337n })
}
