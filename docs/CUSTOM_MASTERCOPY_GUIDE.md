# Using Safe SDK with Custom Mastercopy Deployments

## Overview

The Safe protocol-kit now supports Safe contracts that use custom-deployed L2 mastercopies (also called singletons), as long as the mastercopy bytecode exactly matches an official Safe L2 version. This enables using the SDK on custom networks, testnets, or with independently deployed Safe contracts.

**Supported versions**: Only **1.3.0 L2** and **1.4.1 L2** mastercopies are supported for bytecode matching.

## How It Works

When you initialize a Safe instance, the SDK will:

1. **First attempt**: Call the `VERSION()` method on the Safe contract to determine its version
2. **Fallback mechanism**: If the VERSION() call fails:
   - Read the mastercopy address from storage slot 0 of the Safe proxy
   - Fetch the bytecode of the mastercopy contract
   - Compare the bytecode hash against supported Safe L2 versions (1.3.0 L2 and 1.4.1 L2)
   - If a match is found, use that version to initialize the SDK
   - If no match is found, fall back to the default version (1.3.0)

## Usage Example

No changes are required to your existing code! The new functionality works transparently:

```typescript
import Safe from '@safe-global/protocol-kit'

// Initialize with a Safe that uses a custom-deployed mastercopy
const safe = await Safe.init({
  provider: 'https://your-rpc-url',
  signer: privateKey,
  safeAddress: '0xYourSafeAddress'
})

// The SDK will automatically:
// 1. Try to call VERSION()
// 2. If that fails, read the mastercopy address
// 3. Match the mastercopy bytecode against known versions
// 4. Initialize with the detected version

console.log(safe.getContractVersion()) // e.g., "1.3.0"
```

## Requirements

For the mastercopy matching to work, the following conditions must be met:

1. **Exact bytecode match**: The mastercopy bytecode must be byte-for-byte identical to an official Safe L2 deployment
2. **Contract must be deployed**: Both the Safe proxy and the mastercopy must be deployed on the network
3. **Supported version**: The mastercopy must match one of the supported Safe L2 versions (**1.3.0 L2** or **1.4.1 L2** only)

## Benefits

- **Custom network support**: Deploy Safes on your own test network using official Safe L2 bytecode
- **Independent deployments**: Use Safes where the L2 mastercopy was deployed separately
- **Automatic version detection**: No need to manually specify the version
- **Backward compatible**: Existing code works without modifications

## What Gets Detected

The mastercopy matching detects:
- **Safe version**: Which Safe L2 contract version (1.3.0 or 1.4.1)
- **Singleton type**: Always L2 singleton
- **Mastercopy address**: The address of the matched mastercopy

## Limitations

- **Only L2 versions supported**: Only 1.3.0 L2 and 1.4.1 L2 mastercopies are supported
- Only works with official Safe bytecode (no modified versions)
- The mastercopy must be deployed and accessible on the network
- Performance: The first initialization with a custom mastercopy will require additional RPC calls to fetch and compare bytecode

## Troubleshooting

### My Safe initialization fails with "Invalid ... contract address"

This error means the SDK couldn't find a deployment for the contract type on your network. Make sure:
- The Safe proxy is deployed at the specified address
- The mastercopy referenced by the proxy is also deployed
- You're using the correct RPC endpoint for your network

### The detected version is incorrect

If the SDK detects the wrong version, it likely means:
- The mastercopy bytecode has been modified (not an exact match)
- There's an issue with the RPC provider returning incorrect bytecode

You can always manually specify the version using `contractNetworks`:

```typescript
const safe = await Safe.init({
  provider: 'https://your-rpc-url',
  signer: privateKey,
  safeAddress: '0xYourSafeAddress',
  contractNetworks: {
    [chainId]: {
      safeSingletonAddress: '0xYourMastercopyAddress',
      safeSingletonAbi: [...] // optional
    }
  }
})
```

## Example: Using Safe SDK on a Custom Testnet

```typescript
import Safe from '@safe-global/protocol-kit'

// Scenario: You've deployed a Safe on a custom testnet using official v1.3.0 L2 bytecode
// The Safe proxy address is 0x123...
// The L2 mastercopy was deployed at 0xabc...

const safe = await Safe.init({
  provider: 'https://custom-testnet-rpc.example.com',
  signer: '0xYourPrivateKey',
  safeAddress: '0x123...'
})

// The SDK will:
// 1. Call VERSION() on 0x123... (delegates to mastercopy at 0xabc...)
// 2. If that works, use the returned version
// 3. If that fails:
//    - Read mastercopy address from storage (gets 0xabc...)
//    - Fetch bytecode from 0xabc...
//    - Compare with supported Safe L2 versions (1.3.0 L2 and 1.4.1 L2)
//    - Find it matches v1.3.0 L2
//    - Initialize using v1.3.0 ABI

console.log(safe.getContractVersion()) // "1.3.0"

// Now you can use all Safe SDK features normally
const owners = await safe.getOwners()
const threshold = await safe.getThreshold()
// ... etc
```
