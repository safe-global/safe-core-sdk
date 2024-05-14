# Contributing Guidelines

First off, **thank you** for considering contributing to this project!

## Table of contents

- [I Have a Question](#i-have-a-question)
- [I Want to Contribute](#i-want-to-contribute)

## <a name="i-have-a-question">I Have a Question</a>

See our [support guidelines](https://github.com/safe-global/safe-core-sdk/tree/main/SUPPORT.md). **Do not** use GitHub issues for general support or questions.

## <a name="i-want-to-contribute">I Want to Contribute</a>
### Legal Notice
You will need to agree to [our CLA](https://safe.global/cla) in order to be possible to consider your contribution.

### Starting Guide

By following the steps bellow you will understand the development process and worflow.
1. [Forking the repository](#forking-the-repository)
2. [Installing Node and Yarn](#installing-node-and-yarn)
3. [Installing dependencies](#installing-dependencies)
4. [Running the tests](#running-the-tests)
5. [Using the playground](#using-the-playground)
6. [Submitting a pull request](#submitting-a-pull-request)

#### Forking the repository

The first step would be to [fork the repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo#forking-a-repository). This will allow you to get a current copy of the repository state. Follow the steps to also clone your forked repository locally.

For active development we use the `development` branch. Our `main` branch contains only the currently published code. All new branches should be created from `development`.

#### Installing Node and Yarn

The Safe{Core} SDK uses [Node](https://nodejs.org) as development environment and Yarn to manage the dependencies. You will need to make sure you are using the [latest Node LTS version](https://nodejs.org/en/about/previous-releases) and that you have available Yarn v1.

You can check which versions you are using with:

```bash
node -v
yarn -v
```

#### Installing dependencies    

The Safe{Core} SDK uses a mono-repository structure managed by [Yarn Workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/) and [Lerna](https://lerna.js.org). From the root of the repository you will need to install the whole dependency stack and do the project build. Some packages depend on each other, so even when modifiying only one package it's better to run the full build.

Install all dependencies and build the whole project by using the following commands at the project root.

```bash
yarn install
yarn build
```

#### Running the tests

There is already a test script that can be launched from the root of the repository and will use [Lerna](https://lerna.js.org) to run all the tests from all the packages.

```bash
yarn test
```

If you would like to test individual packages, **once you make sure you did the build from the root**, you can:

```bash
yarn test --scope=<package-name>
yarn test --scope=@safe-global/protocol-kit
yarn test --scope=@safe-global/api-kit
```

For some packages you may need to fill a .env file with some configuration. In those packages you will be able to find a `.env.example` file specifying the necessary parameters.

#### Using the playground

You can use the playground section to do some manual testing using a specific Safe or configuration. The playground can be run from the root of the project as follow:

```bash
yarn play <playground-command>
```

You can find more information about the available commands [in the specific section.](https://github.com/safe-global/safe-core-sdk/tree/main/playground)

#### Submitting a pull request

From the forked repository you can [open a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request) to the original repository. Make sure to select the `safe-global:development` branch as the target branch.
