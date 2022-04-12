import TuneGO from "../../contracts/TuneGO.cdc"

// This transaction is for an admin to start a new collectible series

transaction {
    prepare(acct: AuthAccount) {
        // borrow a reference to the collectible resource in storage
        let admin = acct.borrow<&TuneGO.Admin>(from: TuneGO.AdminStoragePath)
            ?? panic("No admin resource in storage")

        // Increment the series number
        admin.startNewSeries()
    }
}