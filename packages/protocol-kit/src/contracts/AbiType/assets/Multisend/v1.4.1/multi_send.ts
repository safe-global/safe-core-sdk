// Source: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.4.1/multi_send.json
export default {
  defaultAddress: '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
  released: true,
  contractName: 'MultiSend',
  version: '1.4.1',
  networkAddresses: {
    '1': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '5': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '10': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '56': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '71': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '100': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '137': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '1030': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '1101': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '1442': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '4337': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '8192': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '8194': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '8453': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '10243': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '13337': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '11235': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '17000': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '42161': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '42220': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '54211': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '80001': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '84531': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    '11155111': '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526'
  },
  abi: [
    {
      inputs: [],
      stateMutability: 'nonpayable',
      type: 'constructor'
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: 'transactions',
          type: 'bytes'
        }
      ],
      name: 'multiSend',
      outputs: [],
      stateMutability: 'payable',
      type: 'function'
    }
  ]
} as const
