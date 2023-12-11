import { SafeAuthProviderConfig } from './types'

const MAINNET_CHAIN_ID = '0x1'
const POLYGON_CHAIN_ID = '0x89'
const BSC_MAINNET_CHAIN_ID = '0x38'
const AVALANCHE_MAINNET_CHAIN_ID = '0xa86a'
const XDAI_CHAIN_ID = '0x64'
const ARBITRUM_MAINNET_CHAIN_ID = '0xa4b1'
const OPTIMISM_MAINNET_CHAIN_ID = '0xa'
const CELO_MAINNET_CHAIN_ID = '0xa4ec'
const GOERLI_CHAIN_ID = '0x5'
const SEPOLIA_CHAIN_ID = '0xaa36a7'
const POLYGON_MUMBAI_CHAIN_ID = '0x13881'
const BSC_TESTNET_CHAIN_ID = '0x61'
const AVALANCHE_TESTNET_CHAIN_ID = '0xa869'
const ARBITRUM_TESTNET_CHAIN_ID = '0x66eeb'
const OPTIMISM_TESTNET_CHAIN_ID = '0x1a4'

export const CHAIN_CONFIG: Record<string, Partial<SafeAuthProviderConfig>> = {
  [MAINNET_CHAIN_ID]: {
    blockExplorerUrl: 'https://etherscan.io',
    chainId: MAINNET_CHAIN_ID,
    displayName: 'Main Ethereum Network',
    logo: 'eth.svg',
    ticker: 'ETH',
    tickerName: 'Ethereum'
  },
  [POLYGON_CHAIN_ID]: {
    blockExplorerUrl: 'https://polygonscan.com',
    chainId: POLYGON_CHAIN_ID,
    displayName: 'Polygon Mainnet',
    logo: 'matic-network-logo.svg',
    ticker: 'MATIC',
    tickerName: 'Matic Network Token'
  },
  [BSC_MAINNET_CHAIN_ID]: {
    blockExplorerUrl: 'https://bscscan.com',
    chainId: BSC_MAINNET_CHAIN_ID,
    displayName: 'Binance Smart Chain Mainnet',
    logo: 'bnb.png',
    ticker: 'BNB',
    tickerName: 'Binance Coin'
  },
  [AVALANCHE_MAINNET_CHAIN_ID]: {
    blockExplorerUrl: 'https://snowtrace.io',
    chainId: AVALANCHE_MAINNET_CHAIN_ID,
    displayName: 'Avalanche Mainnet C-Chain',
    logo: 'avax.svg',
    ticker: 'AVAX',
    tickerName: 'Avalanche'
  },
  [OPTIMISM_MAINNET_CHAIN_ID]: {
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    chainId: OPTIMISM_MAINNET_CHAIN_ID,
    displayName: 'Optimism',
    logo: 'optimism.svg',
    ticker: 'ETH',
    tickerName: 'Ethereum'
  },
  [CELO_MAINNET_CHAIN_ID]: {
    blockExplorerUrl: 'https://explorer.celo.org',
    chainId: CELO_MAINNET_CHAIN_ID,
    displayName: 'Celo Mainnet',
    logo: 'celo.svg',
    ticker: 'CELO',
    tickerName: 'Celo'
  },
  [ARBITRUM_MAINNET_CHAIN_ID]: {
    blockExplorerUrl: 'https://arbiscan.io',
    chainId: ARBITRUM_MAINNET_CHAIN_ID,
    displayName: 'Arbitrum One',
    logo: 'eth.svg',
    ticker: 'ETH',
    tickerName: 'Ethereum'
  },
  [XDAI_CHAIN_ID]: {
    blockExplorerUrl: 'https://blockscout.com/poa/xdai',
    chainId: XDAI_CHAIN_ID,
    displayName: 'xDai',
    logo: 'xdai.svg',
    ticker: 'DAI',
    tickerName: 'xDai Network Token'
  },
  [GOERLI_CHAIN_ID]: {
    blockExplorerUrl: 'https://goerli.etherscan.io',
    chainId: GOERLI_CHAIN_ID,
    displayName: 'Goerli Test Network',
    logo: 'eth.svg',
    ticker: 'ETH',
    tickerName: 'Ethereum',
    isTestnet: true
  },
  [SEPOLIA_CHAIN_ID]: {
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    chainId: SEPOLIA_CHAIN_ID,
    displayName: 'Sepolia Test Network',
    logo: 'eth.svg',
    ticker: 'ETH',
    tickerName: 'Ethereum',
    isTestnet: true
  },
  [POLYGON_MUMBAI_CHAIN_ID]: {
    blockExplorerUrl: 'https://mumbai.polygonscan.com',
    chainId: POLYGON_MUMBAI_CHAIN_ID,
    displayName: 'Polygon Mumbai',
    logo: 'matic-network-logo.svg',
    ticker: 'MATIC',
    tickerName: 'Matic Network Token',
    isTestnet: true
  },
  [BSC_TESTNET_CHAIN_ID]: {
    blockExplorerUrl: 'https://testnet.bscscan.com',
    chainId: BSC_TESTNET_CHAIN_ID,
    displayName: 'Binance Smart Chain Testnet',
    logo: 'bnb.png',
    ticker: 'BNB',
    tickerName: 'Binance Coin',
    isTestnet: true
  },
  [AVALANCHE_TESTNET_CHAIN_ID]: {
    blockExplorerUrl: 'https://testnet.snowtrace.io',
    chainId: AVALANCHE_TESTNET_CHAIN_ID,
    displayName: 'Avalanche Testnet C-Chain',
    logo: 'avax.png',
    ticker: 'AVAX',
    tickerName: 'Avalanche',
    isTestnet: true
  },
  [ARBITRUM_TESTNET_CHAIN_ID]: {
    blockExplorerUrl: 'https://testnet.arbiscan.io',
    chainId: ARBITRUM_TESTNET_CHAIN_ID,
    displayName: 'Arbitrum Goerli',
    logo: 'eth.svg',
    ticker: 'ETH',
    tickerName: 'Ethereum',
    isTestnet: true
  },
  [OPTIMISM_TESTNET_CHAIN_ID]: {
    blockExplorerUrl: 'https://goerli-optimism.etherscan.io',
    chainId: OPTIMISM_TESTNET_CHAIN_ID,
    displayName: 'Optimism Goerli',
    logo: 'optimism.svg',
    ticker: 'ETH',
    tickerName: 'Ethereum',
    isTestnet: true
  }
}
