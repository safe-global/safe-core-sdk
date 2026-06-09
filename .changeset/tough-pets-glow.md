---
'@safe-global/protocol-kit': major
---

Fix numeric `blockTag` in `SafeProvider.getBalance`, `getNonce`, `getContractCode`, `isContractDeployed`, and `call`, which previously threw. The `blockTag` parameter is now typed as `BlockTag | number` instead of `string | number`, so only viem's block tag literals (`latest`, `earliest`, `pending`, `safe`, `finalized`) or a numeric block id are accepted.
