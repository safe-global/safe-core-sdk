// Source: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.5.0/compatibility_fallback_handler.json
export default {
  contractName: 'CompatibilityFallbackHandler',
  version: '1.5.0',
  abi: [
    {
      inputs: [
        {
          internalType: 'contract ISafe',
          name: 'safe',
          type: 'address'
        },
        {
          internalType: 'bytes',
          name: 'message',
          type: 'bytes'
        }
      ],
      name: 'encodeMessageDataForSafe',
      outputs: [
        {
          internalType: 'bytes',
          name: '',
          type: 'bytes'
        }
      ],
      stateMutability: 'view',
      type: 'function'
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
        },
        {
          internalType: 'uint256',
          name: 'safeTxGas',
          type: 'uint256'
        },
        {
          internalType: 'uint256',
          name: 'baseGas',
          type: 'uint256'
        },
        {
          internalType: 'uint256',
          name: 'gasPrice',
          type: 'uint256'
        },
        {
          internalType: 'address',
          name: 'gasToken',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'refundReceiver',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'nonce',
          type: 'uint256'
        }
      ],
      name: 'encodeTransactionData',
      outputs: [
        {
          internalType: 'bytes',
          name: '',
          type: 'bytes'
        }
      ],
      stateMutability: 'view',
      type: 'function'
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
          internalType: 'contract ISafe',
          name: 'safe',
          type: 'address'
        },
        {
          internalType: 'bytes',
          name: 'message',
          type: 'bytes'
        }
      ],
      name: 'getMessageHashForSafe',
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
      inputs: [],
      name: 'getModules',
      outputs: [
        {
          internalType: 'address[]',
          name: '',
          type: 'address[]'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: '_dataHash',
          type: 'bytes32'
        },
        {
          internalType: 'bytes',
          name: '_signature',
          type: 'bytes'
        }
      ],
      name: 'isValidSignature',
      outputs: [
        {
          internalType: 'bytes4',
          name: '',
          type: 'bytes4'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        },
        {
          internalType: 'address',
          name: '',
          type: 'address'
        },
        {
          internalType: 'uint256[]',
          name: '',
          type: 'uint256[]'
        },
        {
          internalType: 'uint256[]',
          name: '',
          type: 'uint256[]'
        },
        {
          internalType: 'bytes',
          name: '',
          type: 'bytes'
        }
      ],
      name: 'onERC1155BatchReceived',
      outputs: [
        {
          internalType: 'bytes4',
          name: '',
          type: 'bytes4'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        },
        {
          internalType: 'address',
          name: '',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        },
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        },
        {
          internalType: 'bytes',
          name: '',
          type: 'bytes'
        }
      ],
      name: 'onERC1155Received',
      outputs: [
        {
          internalType: 'bytes4',
          name: '',
          type: 'bytes4'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        },
        {
          internalType: 'address',
          name: '',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        },
        {
          internalType: 'bytes',
          name: '',
          type: 'bytes'
        }
      ],
      name: 'onERC721Received',
      outputs: [
        {
          internalType: 'bytes4',
          name: '',
          type: 'bytes4'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'targetContract',
          type: 'address'
        },
        {
          internalType: 'bytes',
          name: 'calldataPayload',
          type: 'bytes'
        }
      ],
      name: 'simulate',
      outputs: [
        {
          internalType: 'bytes',
          name: 'response',
          type: 'bytes'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes4',
          name: 'interfaceId',
          type: 'bytes4'
        }
      ],
      name: 'supportsInterface',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        },
        {
          internalType: 'address',
          name: '',
          type: 'address'
        },
        {
          internalType: 'address',
          name: '',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        },
        {
          internalType: 'bytes',
          name: '',
          type: 'bytes'
        },
        {
          internalType: 'bytes',
          name: '',
          type: 'bytes'
        }
      ],
      name: 'tokensReceived',
      outputs: [],
      stateMutability: 'pure',
      type: 'function'
    }
  ]
} as const
