import TicalUniverse from "../../contracts/TicalUniverse.cdc"

// This transaction is for the admin to create a new set resource
// and store it in the smart contract

transaction() {
    prepare(acct: AuthAccount) {
        // borrow a reference to the Admin resource in storage
        let admin = acct.borrow<&TicalUniverse.Admin>(from: TicalUniverse.AdminStoragePath)
            ?? panic("Could not borrow a reference to the Admin resource")

        // Create a set with the specified name
        admin.createSet(name: "Genesis", description: "Tical Universe")
    }
}
