// Source: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.4.1/create_call.json
export default {
  defaultAddress: '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
  released: true,
  contractName: 'CreateCall',
  version: '1.4.1',
  networkAddresses: {
    '1': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '5': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '10': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '56': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '71': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '97': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '100': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '137': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '1030': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '1101': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '1442': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '3636': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '4337': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '7771': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '8192': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '8194': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '8453': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '10242': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '10243': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '11235': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '13337': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '17000': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '42161': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '42220': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '54211': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '80001': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '81457': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '84531': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '84532': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '11155111': '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    '11155420': '0x9b35Af71d77eaf8d7e40252370304687390A1A52'
  },
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'newContract',
          type: 'address'
        }
      ],
      name: 'ContractCreation',
      type: 'event'
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        },
        {
          internalType: 'bytes',
          name: 'deploymentData',
          type: 'bytes'
        }
      ],
      name: 'performCreate',
      outputs: [
        {
          internalType: 'address',
          name: 'newContract',
          type: 'address'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        },
        {
          internalType: 'bytes',
          name: 'deploymentData',
          type: 'bytes'
        },
        {
          internalType: 'bytes32',
          name: 'salt',
          type: 'bytes32'
        }
      ],
      name: 'performCreate2',
      outputs: [
        {
          internalType: 'address',
          name: 'newContract',
          type: 'address'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
} as const
