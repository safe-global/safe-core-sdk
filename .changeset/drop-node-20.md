---
'@safe-global/api-kit': major
'@safe-global/protocol-kit': major
'@safe-global/relay-kit': major
'@safe-global/sdk-starter-kit': major
'@safe-global/types-kit': major
'@safe-global/testing-kit': minor
---

Drop support for Node.js 20, which reached end-of-life and does not receive the October 2026 security fixes. Every package now declares `engines: { node: ">=22.0.0" }`; consumers on Node < 22 will see install warnings (or hard failures under `engine-strict`). The SDK is developed on Node 22 and tested in CI on Node 24. There are no API or runtime behaviour changes; this release only raises the supported Node.js floor.
