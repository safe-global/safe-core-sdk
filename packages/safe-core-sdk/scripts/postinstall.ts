function postInstall() {
  console.warn(
    'WARNING! "signTransaction" method now *returns* the signed Safe transaction. Update your code according to the new documentation: https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk#signtransaction'
  )
}

postInstall()
