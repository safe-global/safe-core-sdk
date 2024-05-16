// Source: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.1.1/multi_send.json
export default {
  contractName: 'MultiSend',
  version: '1.1.1',
  abi: [
    {
      inputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'constructor'
    },
    {
      constant: false,
      inputs: [
        {
          internalType: 'bytes',
          name: 'transactions',
          type: 'bytes'
        }
      ],
      name: 'multiSend',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
} as const
