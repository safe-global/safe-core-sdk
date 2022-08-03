function postInstall() {
  console.warn(
    `⚠️ the "signTransaction" method now returns a signed Safe transaction. Please update your code according to the new documentation: https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk#signtransaction. In >=v3.0.0, the signature will be added only to the return transaction object, and not to the one passed as an argument.`
  )
}

postInstall()
