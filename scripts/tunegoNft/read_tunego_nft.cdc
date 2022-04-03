import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import TuneGONFT from "../../contracts/TuneGONFT.cdc"

// This script returns the metadata for an NFT in an account's collection.

pub fun main(address: Address, collectibleId: UInt64): &TuneGONFT.NFT {

    // get the public account object for the token owner
    let owner = getAccount(address)

    let collectionBorrow = owner.getCapability(TuneGONFT.CollectionPublicPath)!
        .borrow<&{TuneGONFT.TuneGONFTCollectionPublic}>()
        ?? panic("Could not borrow TuneGONFTCollectionPublic")

    // borrow a reference to a specific NFT in the collection
    let tunegoNFT = collectionBorrow.borrowTuneGONFT(id: collectibleId)
        ?? panic("No such collectibleId in that collection")

    return tunegoNFT
}
