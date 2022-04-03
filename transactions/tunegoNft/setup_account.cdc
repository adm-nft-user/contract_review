import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import TuneGONFT from "../../contracts/TuneGONFT.cdc"

// This transaction configures an account to hold TuneGO NFTs.

transaction {
    prepare(signer: AuthAccount) {
        // if the account doesn't already have a collection
        if signer.borrow<&TuneGONFT.Collection>(from: TuneGONFT.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- TuneGONFT.createEmptyCollection()
            
            // save it to the account
            signer.save(<-collection, to: TuneGONFT.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&TuneGONFT.Collection{NonFungibleToken.CollectionPublic, TuneGONFT.TuneGONFTCollectionPublic}>(TuneGONFT.CollectionPublicPath, target: TuneGONFT.CollectionStoragePath)
        }
    }
}
