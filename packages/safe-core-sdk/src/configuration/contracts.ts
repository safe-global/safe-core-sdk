export interface ContractNetworkConfig {
  /** multiSendAddress - Address of the MultiSend contract deployed on a specific network */
  multiSendAddress: string
  /** safeMasterCopyAddress - Address of the Gnosis Safe Master Copy contract deployed on a specific network */
  safeMasterCopyAddress: string
  /** safeProxyFactoryAddress - Address of the Gnosis Safe Proxy Factory contract deployed on a specific network */
  safeProxyFactoryAddress: string
}

export interface ContractNetworksConfig {
  /** id - Network id */
  [id: string]: ContractNetworkConfig
}

export const defaultContractNetworks: ContractNetworksConfig = {
  // mainnet
  1: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD',
    safeMasterCopyAddress: '0x6851D6fDFAfD08c0295C392436245E5bc78B0185',
    safeProxyFactoryAddress: '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B'
  },
  // rinkeby
  4: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD',
    safeMasterCopyAddress: '0x6851D6fDFAfD08c0295C392436245E5bc78B0185',
    safeProxyFactoryAddress: '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B'
  },
  // goerli
  5: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD',
    safeMasterCopyAddress: '0x6851D6fDFAfD08c0295C392436245E5bc78B0185',
    safeProxyFactoryAddress: '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B'
  },
  // kovan
  42: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD',
    safeMasterCopyAddress: '0x6851D6fDFAfD08c0295C392436245E5bc78B0185',
    safeProxyFactoryAddress: '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B'
  },
  // xdai
  100: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD',
    safeMasterCopyAddress: '0x6851D6fDFAfD08c0295C392436245E5bc78B0185',
    safeProxyFactoryAddress: '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B'
  },
  // energy web chain
  246: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD',
    safeMasterCopyAddress: '0x6851D6fDFAfD08c0295C392436245E5bc78B0185',
    safeProxyFactoryAddress: '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B'
  },
  // energy web volta
  73799: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD',
    safeMasterCopyAddress: '0x6851D6fDFAfD08c0295C392436245E5bc78B0185',
    safeProxyFactoryAddress: '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B'
  }
}
