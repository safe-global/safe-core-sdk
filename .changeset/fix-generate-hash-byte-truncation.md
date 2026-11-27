---
'@safe-global/protocol-kit': patch
---

Fix `generateHash` to truncate by bytes instead of hex characters, and bump the on-chain identifier version to `01` so identifiers produced with the corrected hashes stay distinguishable from the previously published `00` identifiers.
