import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import TunegoNfts from "../../contracts/TunegoNfts.cdc"

// This transaction configures an account to hold Tunego Nfts.

transaction {
    prepare(signer: AuthAccount) {
        // if the account doesn't already have a collection
        if signer.borrow<&TunegoNfts.Collection>(from: TunegoNfts.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- TunegoNfts.createEmptyCollection()
            
            // save it to the account
            signer.save(<-collection, to: TunegoNfts.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&TunegoNfts.Collection{NonFungibleToken.CollectionPublic, TunegoNfts.TunegoNftsCollectionPublic}>(TunegoNfts.CollectionPublicPath, target: TunegoNfts.CollectionStoragePath)
        }
    }
}
