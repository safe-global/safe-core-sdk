export default {
  contractName: 'ProxyFactory',
  version: '1.0.0',
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
