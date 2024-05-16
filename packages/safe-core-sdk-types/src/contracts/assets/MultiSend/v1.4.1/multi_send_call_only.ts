// Source: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.4.1/multi_send_call_only.json
export default {
  contractName: 'MultiSendCallOnly',
  version: '1.4.1',
  abi: [
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
