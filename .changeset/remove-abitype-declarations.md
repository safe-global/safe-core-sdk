---
'@safe-global/api-kit': major
'@safe-global/protocol-kit': major
'@safe-global/relay-kit': major
'@safe-global/types-kit': major
---

Remove the `declare module 'abitype'` augmentations that widened `AddressType` to `string`. Consumers that relied on the widened typing will now see the default `0x${string}` `Address` type from `viem`/`abitype` and may need to add their own `abitype` register configuration or narrow address values explicitly.
