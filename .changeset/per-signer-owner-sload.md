---
'@safe-global/protocol-kit': patch
---

Fix `estimateTxBaseGas` undercounting the cold `owners[signer]` SLOAD performed by `checkSignatures` for every signature. Each signer hashes to a distinct storage slot and pays the EIP-2929 cold surcharge (2,100 gas) on first touch — previously only the first signature was accounted for, leading to a `2,100 × (threshold − 1)` underestimation that scaled linearly with the Safe's threshold.
