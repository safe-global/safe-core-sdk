export default {
  contractName: 'SafeProxyFactory',
  version: '1.5.0',
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
        },
        {
          indexed: false,
          internalType: 'bytes',
          name: 'initializer',
          type: 'bytes'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'saltNonce',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256'
        }
      ],
      name: 'ChainSpecificProxyCreationL2',
      type: 'event'
    },
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
        },
        {
          indexed: false,
          internalType: 'bytes',
          name: 'initializer',
          type: 'bytes'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'saltNonce',
          type: 'uint256'
        }
      ],
      name: 'ProxyCreationL2',
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
        }
      ],
      name: 'createChainSpecificProxyWithNonceL2',
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
      name: 'createProxyWithNonceL2',
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
