export const getTypedData = () => [
  {
    type: 'string',
    name: 'message',
    value: 'Hi, Alice!'
  },
  {
    type: 'uint8',
    name: 'value',
    value: 10
  }
]

export const getV3TypedData = (chainId: string) => ({
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' }
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' }
    ]
  },
  primaryType: 'Mail',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: Number(chainId),
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
  },
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
    },
    contents: 'Hello, Bob!'
  }
})

export const getSafeTxV4TypedData = (chainId: string) => ({
  types: {
    SafeTx: [
      {
        type: 'address',
        name: 'to'
      },
      {
        type: 'uint256',
        name: 'value'
      },
      {
        type: 'bytes',
        name: 'data'
      },
      {
        type: 'uint8',
        name: 'operation'
      },
      {
        type: 'uint256',
        name: 'safeTxGas'
      },
      {
        type: 'uint256',
        name: 'baseGas'
      },
      {
        type: 'uint256',
        name: 'gasPrice'
      },
      {
        type: 'address',
        name: 'gasToken'
      },
      {
        type: 'address',
        name: 'refundReceiver'
      },
      {
        type: 'uint256',
        name: 'nonce'
      }
    ],
    EIP712Domain: [
      {
        name: 'chainId',
        type: 'uint256'
      },
      {
        name: 'verifyingContract',
        type: 'address'
      }
    ]
  },
  domain: {
    chainId: Number(chainId),
    verifyingContract: '0x93B148791c4d93420f421D59705C365DACAcF4C7'
  },
  primaryType: 'SafeTx',
  message: {
    to: '0x03cd3e862972746b9bf9a2ba56308566fd270562',
    value: '100000000000000',
    data: '0x',
    operation: '0',
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0x0000000000000000000000000000000000000000',
    nonce: '19'
  }
})

export const getV4TypedData = (chainId: string) => ({
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallets', type: 'address[]' }
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person[]' },
      { name: 'contents', type: 'string' }
    ],
    Group: [
      { name: 'name', type: 'string' },
      { name: 'members', type: 'Person[]' }
    ]
  },
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: Number(chainId),
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
  },
  primaryType: 'Mail',
  message: {
    from: {
      name: 'Cow',
      wallets: [
        '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF'
      ]
    },
    to: [
      {
        name: 'Bob',
        wallets: [
          '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
          '0xB0B0b0b0b0b0B000000000000000000000000000'
        ]
      }
    ],
    contents: 'Hello, Bob!'
  }
})
