import TuneGO from "../../contracts/TuneGO.cdc"

// This transaction is for the admin to create a new set resource
// and store it in the smart contract

transaction() {
    prepare(acct: AuthAccount) {
        // borrow a reference to the Admin resource in storage
        let admin = acct.borrow<&TuneGO.Admin>(from: TuneGO.AdminStoragePath)
            ?? panic("Could not borrow a reference to the Admin resource")

        // Create a set with the specified name
        admin.createSet(name: "Tical Universe", description: "Tical Universe")
        admin.createSet(name: "TuneKitties", description: "TuneKitties")
    }
}
