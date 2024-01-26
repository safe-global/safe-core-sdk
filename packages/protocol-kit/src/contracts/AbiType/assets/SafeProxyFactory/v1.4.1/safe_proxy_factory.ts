export default {
  defaultAddress: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
  contractName: 'SafeProxyFactory',
  version: '1.4.1',
  released: true,
  networkAddresses: {
    '1': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '5': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '10': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '56': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '71': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '100': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '137': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '1030': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '1101': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '1442': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '4337': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '8192': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '8194': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '8453': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '10243': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '13337': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '11235': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '17000': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '42161': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '42220': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '54211': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '80001': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '84531': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    '11155111': '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67'
  },
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'contract SafeProxy',
          name: 'proxy',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'singleton',
          type: 'address'
        }
      ],
      name: 'ProxyCreation',
      type: 'event'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_singleton',
          type: 'address'
        },
        {
          internalType: 'bytes',
          name: 'initializer',
          type: 'bytes'
        },
        {
          internalType: 'uint256',
          name: 'saltNonce',
          type: 'uint256'
        }
      ],
      name: 'createChainSpecificProxyWithNonce',
      outputs: [
        {
          internalType: 'contract SafeProxy',
          name: 'proxy',
          type: 'address'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_singleton',
          type: 'address'
        },
        {
          internalType: 'bytes',
          name: 'initializer',
          type: 'bytes'
        },
        {
          internalType: 'uint256',
          name: 'saltNonce',
          type: 'uint256'
        },
        {
          internalType: 'contract IProxyCreationCallback',
          name: 'callback',
          type: 'address'
        }
      ],
      name: 'createProxyWithCallback',
      outputs: [
        {
          internalType: 'contract SafeProxy',
          name: 'proxy',
          type: 'address'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_singleton',
          type: 'address'
        },
        {
          internalType: 'bytes',
          name: 'initializer',
          type: 'bytes'
        },
        {
          internalType: 'uint256',
          name: 'saltNonce',
          type: 'uint256'
        }
      ],
      name: 'createProxyWithNonce',
      outputs: [
        {
          internalType: 'contract SafeProxy',
          name: 'proxy',
          type: 'address'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'getChainId',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'proxyCreationCode',
      outputs: [
        {
          internalType: 'bytes',
          name: '',
          type: 'bytes'
        }
      ],
      stateMutability: 'pure',
      type: 'function'
    }
  ]
} as const
