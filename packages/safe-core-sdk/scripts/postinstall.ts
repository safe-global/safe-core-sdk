function postInstall() {
  console.warn(
    'WARNING! "signTransaction" method now *returns* the signed Safe transaction. Update your code according to the new documentation: https://github.com/safe-global/safe-core-sdk/tree/main/packages/safe-core-sdk#signtransaction. In >=v3.0.0 the signature will only be added to the returned object, not the one that is passed as params.'
  )
}

postInstall()
