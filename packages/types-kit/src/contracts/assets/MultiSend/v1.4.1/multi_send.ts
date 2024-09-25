// Source: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.4.1/multi_send.json
export default {
  contractName: 'MultiSend',
  version: '1.4.1',
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
