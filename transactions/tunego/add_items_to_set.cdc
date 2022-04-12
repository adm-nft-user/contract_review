import TuneGO from "../../contracts/TuneGO.cdc"

// This transaction adds multiple Items to a set

transaction() {

    let adminRef: &TuneGO.Admin

    prepare(acct: AuthAccount) {

        // borrow a reference to the Admin resource in storage
        self.adminRef = acct.borrow<&TuneGO.Admin>(from: TuneGO.AdminStoragePath)!
    }

    execute {

        // borrow a reference to the set to be added to
        let setRef = self.adminRef.borrowSet(setId: 2)

        // Add the specified Items Ids
        let itemIds: [UInt32] = [UInt32(2),UInt32(3),UInt32(4),UInt32(5),UInt32(6),UInt32(7),UInt32(8),UInt32(9)]
        setRef.addItems(itemIds: itemIds)
    }
}