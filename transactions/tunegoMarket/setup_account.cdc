import TunegoMarket from "../../contracts/TunegoMarket.cdc"

// This transaction configures an account to hold SaleOffer items.

transaction {
    prepare(signer: AuthAccount) {

        // if the account doesn't already have a collection
        if signer.borrow<&TunegoMarket.Collection>(from: TunegoMarket.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- TunegoMarket.createEmptyCollection() as @TunegoMarket.Collection
            
            // save it to the account
            signer.save(<-collection, to: TunegoMarket.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&TunegoMarket.Collection{TunegoMarket.CollectionPublic}>(TunegoMarket.CollectionPublicPath, target: TunegoMarket.CollectionStoragePath)
        }
    }
}
