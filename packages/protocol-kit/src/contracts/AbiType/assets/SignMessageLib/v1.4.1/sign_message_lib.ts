// Source: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.4.1/sign_message_lib.json
export default {
  defaultAddress: '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
  contractName: 'SignMessageLib',
  version: '1.4.1',
  released: true,
  networkAddresses: {
    '1': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '5': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '10': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '56': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '71': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '100': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '137': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '1030': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '1101': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '1442': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '4337': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '8192': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '8194': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '8453': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '84532': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '10243': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '13337': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '11235': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '17000': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '42161': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '42220': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '54211': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '80001': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '84531': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    '11155111': '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9'
  },
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
