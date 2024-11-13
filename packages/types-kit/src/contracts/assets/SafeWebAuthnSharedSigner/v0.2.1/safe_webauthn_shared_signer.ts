export default {
  contractName: 'SafeWebAuthnSharedSigner',
  abi: [
    {
      inputs: [],
      stateMutability: 'nonpayable',
      type: 'constructor'
    },
    {
      inputs: [],
      name: 'NotDelegateCalled',
      type: 'error'
    },
    {
      inputs: [],
      name: 'SIGNER_SLOT',
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
      inputs: [
        {
          components: [
            {
              internalType: 'uint256',
              name: 'x',
              type: 'uint256'
            },
            {
              internalType: 'uint256',
              name: 'y',
              type: 'uint256'
            },
            {
              internalType: 'P256.Verifiers',
              name: 'verifiers',
              type: 'uint176'
            }
          ],
          internalType: 'struct SafeWebAuthnSharedSigner.Signer',
          name: 'signer',
          type: 'tuple'
        }
      ],
      name: 'configure',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address'
        }
      ],
      name: 'getConfiguration',
      outputs: [
        {
          components: [
            {
              internalType: 'uint256',
              name: 'x',
              type: 'uint256'
            },
            {
              internalType: 'uint256',
              name: 'y',
              type: 'uint256'
            },
            {
              internalType: 'P256.Verifiers',
              name: 'verifiers',
              type: 'uint176'
            }
          ],
          internalType: 'struct SafeWebAuthnSharedSigner.Signer',
          name: 'signer',
          type: 'tuple'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'message',
          type: 'bytes32'
        },
        {
          internalType: 'bytes',
          name: 'signature',
          type: 'bytes'
        }
      ],
      name: 'isValidSignature',
      outputs: [
        {
          internalType: 'bytes4',
          name: 'magicValue',
          type: 'bytes4'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes'
        },
        {
          internalType: 'bytes',
          name: 'signature',
          type: 'bytes'
        }
      ],
      name: 'isValidSignature',
      outputs: [
        {
          internalType: 'bytes4',
          name: 'magicValue',
          type: 'bytes4'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    }
  ]
} as const
