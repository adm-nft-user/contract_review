import TicalUniverse from "../../contracts/TicalUniverse.cdc"

transaction(recipient: Address, setId: UInt32, itemId: UInt32, quantity: UInt64) {

    // Local variable for the admin object
    let adminRef: &TicalUniverse.Admin

    prepare(acct: AuthAccount) {

        // borrow a reference to the Admin resource in storage
        self.adminRef = acct.borrow<&TicalUniverse.Admin>(from: TicalUniverse.AdminStoragePath)!
    }

    execute {

        // borrow a reference to the set to be minted from
        let setRef = self.adminRef.borrowSet(setId: setId)

        // Mint all the new NFTs
        let collection <- setRef.batchMintCollectible(itemId: itemId, quantity: quantity)

        // Get the account object for the recipient of the minted tokens
        let recipient = getAccount(recipient)

        // get the Collection reference for the receiver
        let receiverRef = recipient.getCapability(TicalUniverse.CollectionPublicPath).borrow<&{TicalUniverse.TicalUniverseCollectionPublic}>()
            ?? panic("Cannot borrow a reference to the recipient's collection")

        // deposit the NFT in the receivers collection
        receiverRef.batchDeposit(tokens: <-collection)
    }
}
