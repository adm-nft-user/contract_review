import TicalUniverse from "../../contracts/TicalUniverse.cdc"

// This transaction is for an admin to start a new collectible series

transaction {
    prepare(acct: AuthAccount) {
        // borrow a reference to the collectible resource in storage
        let admin = acct.borrow<&TicalUniverse.Admin>(from: TicalUniverse.AdminStoragePath)
            ?? panic("No admin resource in storage")

        // Increment the series number
        admin.startNewSeries()
    }
}