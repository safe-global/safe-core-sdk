---
'@safe-global/api-kit': minor
'@safe-global/protocol-kit': minor
'@safe-global/relay-kit': minor
'@safe-global/sdk-starter-kit': minor
'@safe-global/testing-kit': minor
'@safe-global/types-kit': minor
---

Migrate the repository from Yarn v1 to pnpm 10.16+. Each package now declares `engines: { node: ">=20", pnpm: ">=10.16" }`, which tightens the supported install matrix: consumers on Node < 20 will see install warnings (or hard failures under `engine-strict`). Internal `semver` and `@types/semver` ranges were bumped to `^7.8.0` / `^7.7.1`, and `testing-kit` now declares `glob` as a direct dependency. Because pnpm no longer hoists transitive dependencies, downstream projects relying on packages that were previously reachable through the Safe SDK's hoisted tree must now declare them explicitly.
