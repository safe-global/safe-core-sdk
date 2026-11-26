---
'@safe-global/protocol-kit': patch
'@safe-global/relay-kit': patch
---

Build with TypeScript 5.9. Passkey helpers and the WebAuthn test shim now pass `Uint8Array`/`ArrayBuffer` values that satisfy the stricter `BufferSource` typing; the test shim's `rawId` and `userHandle` are now `ArrayBuffer` as the WebAuthn spec requires. No public API changes.
