import TuneGO from "../../contracts/TuneGO.cdc"

// This transaction is how a admin adds a created Item to a set

transaction() {

    prepare(acct: AuthAccount) {

        // borrow a reference to the Admin resource in storage
        let admin = acct.borrow<&TuneGO.Admin>(from: TuneGO.AdminStoragePath)
            ?? panic("Could not borrow a reference to the Admin resource")

        // Borrow a reference to the set to be added to
        let setRef = admin.borrowSet(setId: 1)

        // Add the specified Item Id
        setRef.addItem(itemId: 1)
    }
}