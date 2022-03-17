import TicalUniverse from "../../contracts/TicalUniverse.cdc"

// This transaction adds multiple Items to a set

transaction() {

    let adminRef: &TicalUniverse.Admin

    prepare(acct: AuthAccount) {

        // borrow a reference to the Admin resource in storage
        self.adminRef = acct.borrow<&TicalUniverse.Admin>(from: TicalUniverse.AdminStoragePath)!
    }

    execute {

        // borrow a reference to the set to be added to
        let setRef = self.adminRef.borrowSet(setId: 1)

        // Add the specified Items Ids
        let itemIds: [UInt32] = [UInt32(1),UInt32(2),UInt32(3),UInt32(4),UInt32(5)]
        setRef.addItems(itemIds: itemIds)
    }
}