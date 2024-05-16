// Source: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.4.1/sign_message_lib.json
export default {
  contractName: 'SignMessageLib',
  version: '1.4.1',
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'msgHash',
          type: 'bytes32'
        }
      ],
      name: 'SignMsg',
      type: 'event'
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: 'message',
          type: 'bytes'
        }
      ],
      name: 'getMessageHash',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: '_data',
          type: 'bytes'
        }
      ],
      name: 'signMessage',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
} as const
