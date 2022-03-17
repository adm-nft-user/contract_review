transaction(contractName: String, code: String) {

    prepare(tunegoContractAccount: AuthAccount) {
        let contract = tunegoContractAccount.contracts.get(name: contractName)
        if contract == nil {
            tunegoContractAccount.contracts.add(
                name: contractName,
                code: code.decodeHex()
            )
        } else {
            tunegoContractAccount.contracts.update__experimental(name: contractName, code: code.decodeHex())
        }
    }
}