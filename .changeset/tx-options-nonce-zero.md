---
'@safe-global/protocol-kit': patch
---

Keep an explicit `TransactionOptions.nonce` of `0` when converting execution options. `createTxOptions` and `createLegacyTxOptions` guarded the nonce with a truthiness check, so a caller-supplied nonce of `0` (a valid nonce for a fresh signer or a local/dev chain) was silently dropped and the wallet/provider picked the nonce instead.
