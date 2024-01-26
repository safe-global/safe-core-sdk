export default {
  defaultAddress: '0x12302fE9c02ff50939BaAaaf415fc226C078613C',
  released: true,
  contractName: 'ProxyFactory',
  version: '1.0.0',
  networkAddresses: {
    '1': '0x12302fE9c02ff50939BaAaaf415fc226C078613C',
    '4': '0x12302fE9c02ff50939BaAaaf415fc226C078613C',
    '5': '0x12302fE9c02ff50939BaAaaf415fc226C078613C',
    '42': '0x12302fE9c02ff50939BaAaaf415fc226C078613C',
    '100': '0x12302fE9c02ff50939BaAaaf415fc226C078613C'
  },
  abi: [
    {
      constant: false,
      inputs: [
        {
          name: '_mastercopy',
          type: 'address'
        },
        {
          name: 'initializer',
          type: 'bytes'
        },
        {
          name: 'saltNonce',
          type: 'uint256'
        }
      ],
      name: 'createProxyWithNonce',
      outputs: [
        {
          name: 'proxy',
          type: 'address'
        }
      ],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      constant: true,
      inputs: [],
      name: 'proxyCreationCode',
      outputs: [
        {
          name: '',
          type: 'bytes'
        }
      ],
      payable: false,
      stateMutability: 'pure',
      type: 'function'
    },
    {
      constant: false,
      inputs: [
        {
          name: 'masterCopy',
          type: 'address'
        },
        {
          name: 'data',
          type: 'bytes'
        }
      ],
      name: 'createProxy',
      outputs: [
        {
          name: 'proxy',
          type: 'address'
        }
      ],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      constant: true,
      inputs: [],
      name: 'proxyRuntimeCode',
      outputs: [
        {
          name: '',
          type: 'bytes'
        }
      ],
      payable: false,
      stateMutability: 'pure',
      type: 'function'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          name: 'proxy',
          type: 'address'
        }
      ],
      name: 'ProxyCreation',
      type: 'event'
    }
  ]
} as const
