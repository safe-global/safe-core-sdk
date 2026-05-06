import fs from 'fs'
import fetch from 'node-fetch'
import { networks } from '../src/utils/config'

const SAFE_CONFIG_URL = 'https://safe-config.safe.global/api/v1/chains/'

type ChainConfig = {
  chainId: string
  shortName: string
  transactionService: string
}

type ChainResponse = {
  next: string | null
  results: ChainConfig[]
}

async function fetchAllChains(): Promise<ChainConfig[]> {
  const chains: ChainConfig[] = []
  let url: string | null = SAFE_CONFIG_URL

  while (url) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch chains: ${response.statusText}`)
    }
    const data = (await response.json()) as ChainResponse
    chains.push(...data.results)
    url = data.next
  }

  return chains
}

// Extracts the label used in the tx service URL path, e.g.:
// "https://api.safe.global/tx-service/eth" → "eth"
function extractTxServiceLabel(transactionService: string): string {
  const label = transactionService.replace(/\/$/, '').split('/').pop()
  if (!label) {
    throw new Error(`Could not extract label from transactionService URL: ${transactionService}`)
  }
  return label
}

function updateConfigFile(updatedNetworks: { chainId: bigint; shortName: string }[]) {
  const path = 'src/utils/config.ts'

  const content = fs.readFileSync(path, 'utf-8')

  const startMarker = 'export const networks: NetworkShortName[] = ['
  const endMarker = ']\n'
  const startIndex = content.indexOf(startMarker) + startMarker.length
  const endIndex = content.indexOf(endMarker, startIndex)

  const sorted = updatedNetworks
    .sort((a, b) => Number(a.chainId - b.chainId))
    .map(
      ({ chainId, shortName }, index) =>
        `  { chainId: ${chainId}n, shortName: '${shortName}' }${index === updatedNetworks.length - 1 ? '' : ','}`
    )
    .join('\n')

  fs.writeFileSync(
    path,
    `${content.substring(0, startIndex)}\n${sorted}\n${content.substring(endIndex)}`
  )

  console.log('Networks array updated successfully!')
}

async function main() {
  const remoteChains = await fetchAllChains()
  const localChainIds = new Set(networks.map((n) => n.chainId.toString()))

  const missing = remoteChains.filter(({ chainId }) => !localChainIds.has(chainId))

  if (missing.length === 0) {
    console.log('All networks are up to date.')
    return
  }

  console.log(`Adding ${missing.length} missing network(s):`)
  for (const { chainId, transactionService } of missing) {
    const label = extractTxServiceLabel(transactionService)
    console.log(`  chainId: ${chainId}, txService label: ${label}`)
  }

  const updatedNetworks = [
    ...networks.map(({ chainId, shortName }) => ({ chainId, shortName })),
    ...missing.map(({ chainId, transactionService }) => ({
      chainId: BigInt(chainId),
      shortName: extractTxServiceLabel(transactionService)
    }))
  ]

  updateConfigFile(updatedNetworks)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
