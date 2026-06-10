# Contributing Guidelines

First off, **thank you** for considering contributing to this project!

## Table of contents

- [I Have a Question](#i-have-a-question)
- [I Want to Contribute](#i-want-to-contribute)

## <a name="i-have-a-question">I Have a Question</a>

See our [support guidelines](https://github.com/safe-global/safe-core-sdk/tree/main/SUPPORT.md). **Do not** use GitHub issues for general support or questions.

## <a name="i-want-to-contribute">I Want to Contribute</a>
### Legal Notice
You will need to agree to [our CLA](https://safe.global/cla) in order for us to consider your contribution.

### Starting Guide

By following the steps below you will understand the development process and workflow.
1. [Forking the repository](#forking-the-repository)
2. [Installing Node and pnpm](#installing-node-and-pnpm)
3. [Installing dependencies](#installing-dependencies)
4. [Running the tests](#running-the-tests)
5. [Using the playground](#using-the-playground)
6. [Adding a changeset](#adding-a-changeset)
7. [Submitting a pull request](#submitting-a-pull-request)

#### Forking the repository

The first step would be to [fork the repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo#forking-a-repository). This will allow you to get a current copy of the repository state. Follow the steps to also clone your forked repository locally.

For active development we use the `development` branch. Our `main` branch contains only the currently published code. All new branches should be created from `development`.

#### Installing Node and pnpm

The Safe{Core} SDK uses [Node](https://nodejs.org) as development environment and pnpm to manage the dependencies. You will need to make sure you are using the [latest Node LTS version](https://nodejs.org/en/about/previous-releases) and that you have available pnpm 10.16+.

You can check which versions you are using with:

```bash
node -v
pnpm -v
```

#### Installing dependencies    

The Safe{Core} SDK uses a mono-repository structure managed by [pnpm workspaces](https://pnpm.io/workspaces), with [Changesets](https://github.com/changesets/changesets) handling independent versioning and publishing of each package. From the root of the repository you will need to install the whole dependency stack and do the project build. Some packages depend on each other, so even when modifying only one package it's better to run the full build.

Install all dependencies and build the whole project by using the following commands at the project root.

```bash
pnpm install
pnpm build
```

#### Running the tests

There is already a test script that can be launched from the root of the repository and will run all the tests from all the packages.

```bash
pnpm test
```

If you would like to test individual packages, **once you make sure you did the build from the root**, you can:

```bash
pnpm --filter <package-name> test
pnpm --filter @safe-global/protocol-kit test
pnpm --filter @safe-global/api-kit test
```

For some packages you may need to fill a .env file with some configuration. In those packages you will be able to find a `.env.example` file specifying the necessary parameters.

#### Using the playground

You can use the playground section to do some manual testing using a specific Safe or configuration. The playground can be run from the root of the project as follow:

```bash
pnpm play <playground-command>
```

You can find more information about the available commands [in the specific section.](https://github.com/safe-global/safe-core-sdk/tree/main/playground)

#### Adding a changeset

Any pull request that changes the public behavior of one or more published packages must include a changeset describing the change. Changesets drive both the per-package version bumps and the auto-generated `CHANGELOG.md` entries.

From the root of the repository run:

```bash
pnpm changeset
```

The interactive prompt will ask:

1. Which packages are affected by the change.
2. The bump type for each affected package (`patch`, `minor`, or `major`, following [semver](https://semver.org/)).
3. A short summary of the change. This text becomes the changelog entry, so write it for the consumers of the package.

This creates a new markdown file under `.changeset/` that you should commit as part of your pull request.

Changes that don't affect any published package (CI config, internal scripts, docs, tests, etc.) don't need a changeset.

#### Submitting a pull request

From the forked repository you can [open a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request) to the original repository. Make sure to select the `safe-global:development` branch as the target branch.
