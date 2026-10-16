---
'@safe-global/protocol-kit': patch
---

Fix `signTransaction` throwing a `TypeError` when signing a contract (nested Safe) signature for a `SafeMultisigTransactionResponse` input on Safe versions `>=1.3.0 <1.5.0`. The `>=1.3.0` `SigningMethod.SAFE_SIGNATURE` branch computed the EIP-712 preimage from the raw input's `.data` field instead of the already-converted `SafeTransaction`, so a `SafeMultisigTransactionResponse` (whose `.data` is a calldata hex string, not a `SafeTransactionData` object) crashed instead of producing a signature.
