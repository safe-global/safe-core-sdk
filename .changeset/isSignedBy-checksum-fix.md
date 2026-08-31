---
"@safe-global/protocol-kit": patch
"@safe-global/types-kit": patch
---

Add `isSignedBy(signer)` to `SafeTransaction`/`SafeMessage` for checksum-safe signature lookups. The `signatures` Map stores signer addresses lowercased internally, so `signatures.has(checksummedAddress)` always returned `false` unless the caller passed an already-lowercased address - `isSignedBy` normalizes the input before checking.
