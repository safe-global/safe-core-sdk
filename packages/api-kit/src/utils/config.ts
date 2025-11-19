const TRANSACTION_SERVICE_URL = 'https://api.safe.global/tx-service'

type NetworkShortName = {
  shortName: string
  chainId: bigint
}

export const networks: NetworkShortName[] = [
  { chainId: 1n, shortName: 'eth' },
  { chainId: 10n, shortName: 'oeth' },
  { chainId: 56n, shortName: 'bnb' },
  { chainId: 100n, shortName: 'gno' },
  { chainId: 130n, shortName: 'unichain' },
  { chainId: 137n, shortName: 'pol' },
  { chainId: 143n, shortName: "monad" },
  { chainId: 146n, shortName: 'sonic' },
  { chainId: 196n, shortName: 'okb' },
  { chainId: 204n, shortName: "opbnb" },
  { chainId: 232n, shortName: 'lens' },
  { chainId: 324n, shortName: 'zksync' },
  { chainId: 480n, shortName: 'wc' },
  { chainId: 1101n, shortName: 'zkevm' },
  { chainId: 5000n, shortName: 'mantle' },
  { chainId: 8453n, shortName: 'base' },
  { chainId: 10200n, shortName: 'chi' },
  { chainId: 42161n, shortName: 'arb1' },
  { chainId: 43111n, shortName: 'hemi' },
  { chainId: 57073n, shortName: 'ink' },
  { chainId: 80094n, shortName: 'berachain' },
  { chainId: 59144n, shortName: 'linea' },
  { chainId: 42220n, shortName: 'celo' },
  { chainId: 43114n, shortName: 'avax' },
  { chainId: 84532n, shortName: 'basesep' },
  { chainId: 534352n, shortName: 'scr' },
  { chainId: 11155111n, shortName: 'sep' },
  { chainId: 1313161554n, shortName: 'aurora' }
]

export const getNetworkShortName = (chainId: bigint): string => {
  const network = networks.find((n) => n.chainId === chainId)
  if (!network) {
    throw new Error(`Network with chainId ${chainId} not found`)
  }
  return network.shortName
}

export const getTransactionServiceUrl = (chainId: bigint) => {
  return `${TRANSACTION_SERVICE_URL}/${getNetworkShortName(chainId)}/api`
}
