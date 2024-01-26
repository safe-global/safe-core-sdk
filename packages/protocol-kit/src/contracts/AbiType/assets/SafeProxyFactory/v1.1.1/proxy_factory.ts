export default {
  defaultAddress: '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B',
  released: true,
  contractName: 'ProxyFactory',
  version: '1.1.1',
  networkAddresses: {
    '1': '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B',
    '4': '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B',
    '5': '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B',
    '42': '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B',
    '88': '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B',
    '100': '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B',
    '246': '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B',
    '73799': '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B'
  },
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'contract GnosisSafeProxy',
          name: 'proxy',
          type: 'address'
        }
      ],
      name: 'ProxyCreation',
      type: 'event'
    },
    {
      constant: false,
      inputs: [
        {
          internalType: 'address',
          name: 'masterCopy',
          type: 'address'
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes'
        }
      ],
      name: 'createProxy',
      outputs: [
        {
          internalType: 'contract GnosisSafeProxy',
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
          internalType: 'bytes',
          name: '',
          type: 'bytes'
        }
      ],
      payable: false,
      stateMutability: 'pure',
      type: 'function'
    },
    {
      constant: true,
      inputs: [],
      name: 'proxyCreationCode',
      outputs: [
        {
          internalType: 'bytes',
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
          internalType: 'address',
          name: '_mastercopy',
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
          internalType: 'contract GnosisSafeProxy',
          name: 'proxy',
          type: 'address'
        }
      ],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      constant: false,
      inputs: [
        {
          internalType: 'address',
          name: '_mastercopy',
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
          internalType: 'contract GnosisSafeProxy',
          name: 'proxy',
          type: 'address'
        }
      ],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      constant: false,
      inputs: [
        {
          internalType: 'address',
          name: '_mastercopy',
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
      name: 'calculateCreateProxyWithNonceAddress',
      outputs: [
        {
          internalType: 'contract GnosisSafeProxy',
          name: 'proxy',
          type: 'address'
        }
      ],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
} as const
