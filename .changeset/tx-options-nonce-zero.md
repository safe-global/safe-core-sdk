---
'@safe-global/protocol-kit': patch
---

Preserve `TransactionOptions.nonce = 0` when converting execution options so a caller-supplied zero nonce is not dropped.
