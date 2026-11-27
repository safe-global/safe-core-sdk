---
'@safe-global/protocol-kit': patch
---

Support contract-wallet signatures in `generateEIP712Signature`. Preserves opaque signature bytes from smart contract accounts (such as Coinbase Smart Wallet) and encodes the Safe contract-signature envelope (`isContractSignature = true`) instead of corrupting trailing padding bytes and treating them as raw ECDSA signatures. Ordinary EOA signing (including Ledger recovery byte normalization and delegated EOAs) continues to be handled as ECDSA.
