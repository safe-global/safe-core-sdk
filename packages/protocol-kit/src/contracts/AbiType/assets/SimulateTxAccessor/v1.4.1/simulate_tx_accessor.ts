// Source: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.4.1/simulate_tx_accessor.json
export default {
  defaultAddress: '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
  released: true,
  contractName: 'SimulateTxAccessor',
  version: '1.4.1',
  networkAddresses: {
    '1': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '5': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '10': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '56': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '71': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '97': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '100': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '137': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '1030': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '1101': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '1442': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '3636': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '4337': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '7771': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '8192': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '8194': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '8453': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '10242': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '10243': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '11235': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '13337': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '17000': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '42161': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '42220': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '54211': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '80001': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '81457': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '84531': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '84532': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '11155111': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
    '11155420': '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199'
  },
  abi: [
    {
      inputs: [],
      stateMutability: 'nonpayable',
      type: 'constructor'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes'
        },
        {
          internalType: 'enum Enum.Operation',
          name: 'operation',
          type: 'uint8'
        }
      ],
      name: 'simulate',
      outputs: [
        {
          internalType: 'uint256',
          name: 'estimate',
          type: 'uint256'
        },
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        },
        {
          internalType: 'bytes',
          name: 'returnData',
          type: 'bytes'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
} as const
