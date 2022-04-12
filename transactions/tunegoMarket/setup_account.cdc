import TuneGOMarket from "../../contracts/TuneGOMarket.cdc"

// This transaction configures an account to hold SaleOffer items.

transaction {
    prepare(signer: AuthAccount) {

        // if the account doesn't already have a collection
        if signer.borrow<&TuneGOMarket.Collection>(from: TuneGOMarket.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- TuneGOMarket.createEmptyCollection() as @TuneGOMarket.Collection
            
            // save it to the account
            signer.save(<-collection, to: TuneGOMarket.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&TuneGOMarket.Collection{TuneGOMarket.CollectionPublic}>(TuneGOMarket.CollectionPublicPath, target: TuneGOMarket.CollectionStoragePath)
        }
    }
}
