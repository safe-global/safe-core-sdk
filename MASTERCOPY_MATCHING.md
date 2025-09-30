# Mastercopy Code Matching Implementation

## Overview

This implementation adds support for Safe contracts whose mastercopy address is not listed in the official `safe-deployments` package. Instead of refusing to initialize, the SDK now attempts to match the mastercopy's bytecode hash against all known Safe versions.

## Implementation Details

### 1. Mastercopy Matcher Utility (`src/utils/mastercopyMatcher.ts`)

Three main functions are provided:

#### `getMasterCopyAddressFromProxy(safeProvider, safeAddress)`
- Reads the mastercopy address from storage slot 0 of the Safe proxy
- Returns the checksummed mastercopy address

#### `matchContractCodeToSafeVersion(safeProvider, contractAddress, chainId, isL1SafeSingleton)`
- Fetches the bytecode of the contract at the given address
- Computes the keccak256 hash of the bytecode
- Compares against all known Safe versions (1.4.1, 1.3.0, 1.2.0, 1.1.1, 1.0.0)
- Checks both L1 and L2 singleton variants
- Uses the pre-computed `codeHash` from safe-deployments for efficient matching
- Returns the matched version and whether it's an L1 singleton, or undefined if no match

#### `detectSafeVersionFromMastercopy(safeProvider, safeAddress, chainId, isL1SafeSingleton)`
- Combines the above two functions
- Reads the mastercopy address from the Safe proxy
- Matches the mastercopy code to a known Safe version
- Returns version, mastercopy address, and L1 flag, or undefined if detection fails

### 2. Contract Manager Integration (`src/managers/contractManager.ts`)

Modified the `#initializeContractManager` method to use mastercopy matching as a fallback:

```typescript
try {
  // Try to fetch the version via VERSION() call
  safeVersion = await getSafeContractVersion(safeProvider, safeAddress)
} catch (e) {
  // If VERSION() fails, try mastercopy matching
  const mastercopyMatch = await detectSafeVersionFromMastercopy(
    safeProvider,
    safeAddress,
    chainId,
    isL1SafeSingleton
  )
  
  if (mastercopyMatch) {
    // Successfully matched - use detected version and L1 flag
    safeVersion = mastercopyMatch.version
    detectedIsL1 = mastercopyMatch.isL1
  } else {
    // No match found - fall back to default version
    safeVersion = DEFAULT_SAFE_VERSION
  }
}
```

The detected `isL1` flag is then passed to `getSafeContract` to ensure the correct singleton type is used.

## Benefits

1. **Backward Compatibility**: Safes deployed with official mastercopies work exactly as before
2. **Extended Support**: Safes using custom-deployed (but code-identical) mastercopies are now supported
3. **Graceful Fallback**: If VERSION() call fails for any reason, the SDK attempts mastercopy matching before falling back to the default version
4. **Accurate Detection**: By comparing bytecode hashes, we ensure the mastercopy is exactly the same as an official version
5. **Automatic L1/L2 Detection**: The implementation correctly identifies whether a Safe uses an L1 or L2 singleton

## Use Cases

This implementation enables the SDK to work with:
- Safes deployed on custom networks or testnets using official Safe bytecode
- Safes where the mastercopy was deployed independently but matches official versions
- Safes where the VERSION() method is inaccessible but the bytecode is correct

## Testing

Unit tests have been added in `tests/unit/mastercopy-matcher.test.ts` covering:
- Extracting mastercopy address from storage
- Matching contract code against known versions
- End-to-end detection workflow
- Error handling and edge cases

## Security Considerations

- The implementation only accepts mastercopies whose bytecode EXACTLY matches official Safe deployments
- No custom or modified mastercopies are accepted unless they have the identical bytecode hash
- The keccak256 hash comparison provides cryptographic assurance of code identity
