import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import TuneGO from "../../contracts/TuneGO.cdc"

// This transaction configures an account to hold TuneGO collectibles.

transaction {
    prepare(signer: AuthAccount) {
        // if the account doesn't already have a collection
        if signer.borrow<&TuneGO.Collection>(from: TuneGO.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- TuneGO.createEmptyCollection()
            
            // save it to the account
            signer.save(<-collection, to: TuneGO.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&TuneGO.Collection{NonFungibleToken.CollectionPublic, TuneGO.TuneGOCollectionPublic}>(TuneGO.CollectionPublicPath, target: TuneGO.CollectionStoragePath)
        }
    }
}
