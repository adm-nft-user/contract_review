import TuneGO from "../../contracts/TuneGO.cdc"

transaction(recipient: Address, setId: UInt32, itemId: UInt32, quantity: UInt64) {

    // Local variable for the admin object
    let adminRef: &TuneGO.Admin

    prepare(acct: AuthAccount) {

        // borrow a reference to the Admin resource in storage
        self.adminRef = acct.borrow<&TuneGO.Admin>(from: TuneGO.AdminStoragePath)!
    }

    execute {

        // borrow a reference to the set to be minted from
        let setRef = self.adminRef.borrowSet(setId: setId)

        // Mint all the new NFTs
        let collection <- setRef.batchMintCollectible(itemId: itemId, quantity: quantity)

        // Get the account object for the recipient of the minted tokens
        let recipient = getAccount(recipient)

        // get the Collection reference for the receiver
        let receiverRef = recipient.getCapability(TuneGO.CollectionPublicPath).borrow<&{TuneGO.TuneGOCollectionPublic}>()
            ?? panic("Cannot borrow a reference to the recipient's collection")

        // deposit the NFT in the receivers collection
        receiverRef.batchDeposit(tokens: <-collection)
    }
}
