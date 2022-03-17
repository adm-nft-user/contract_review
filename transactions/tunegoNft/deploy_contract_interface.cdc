transaction(contractName: String, code: String) {

    prepare(tunegoContractsAccount: AuthAccount) {
        let contract = tunegoContractsAccount.contracts.get(name: contractName)
        if contract == nil {
            tunegoContractsAccount.contracts.add(name: contractName, code: code.decodeHex())
        } else {
            tunegoContractsAccount.contracts.update__experimental(name: contractName, code: code.decodeHex())
        }
    }
}