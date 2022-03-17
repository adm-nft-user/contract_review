import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import TicalUniverse from "../../contracts/TicalUniverse.cdc"

// This transaction configures an account to hold TicalUniverse collectibles.

transaction {
    prepare(signer: AuthAccount) {
        // if the account doesn't already have a collection
        if signer.borrow<&TicalUniverse.Collection>(from: TicalUniverse.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- TicalUniverse.createEmptyCollection()
            
            // save it to the account
            signer.save(<-collection, to: TicalUniverse.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&TicalUniverse.Collection{NonFungibleToken.CollectionPublic, TicalUniverse.TicalUniverseCollectionPublic}>(TicalUniverse.CollectionPublicPath, target: TicalUniverse.CollectionStoragePath)
        }
    }
}
