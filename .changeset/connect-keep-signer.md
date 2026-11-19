---
'@safe-global/protocol-kit': patch
---

fix: keep the current signer in `connect()` when no `signer` is passed, like `provider`. Passing `signer: undefined` explicitly still connects without a signer.
