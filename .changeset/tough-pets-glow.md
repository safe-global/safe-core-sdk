---
'@safe-global/protocol-kit': patch
---

Fix numeric `blockTag` in `SafeProvider.getBalance`, `getNonce`, `getContractCode`, `isContractDeployed`, and `call`, which previously threw when given a number.
