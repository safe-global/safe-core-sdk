interface ContractNetworkConfig {
  multiSendAddress: string
}

export interface ContractNetworksConfig {
  [id: string]: ContractNetworkConfig
}

export const defaultContractNetworks: ContractNetworksConfig = {
  // mainnet
  1: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD'
  },
  // rinkeby
  4: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD'
  },
  // goerli
  5: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD'
  },
  // kovan
  42: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD'
  },
  // xdai
  100: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD'
  },
  // energy web chain
  246: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD'
  },
  // energy web volta
  73799: {
    multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD'
  }
}
