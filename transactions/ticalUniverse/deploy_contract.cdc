transaction(contractName: String, code: String) {
    prepare(ticalUniverseContractAccount: AuthAccount) {
        let contract = ticalUniverseContractAccount.contracts.get(name: contractName)
        if contract == nil {
            ticalUniverseContractAccount.contracts.add(
                name: contractName,
                code: code.decodeHex()
            )
        } else {
            ticalUniverseContractAccount.contracts.update__experimental(name: contractName, code: code.decodeHex())
        }
    }
}
