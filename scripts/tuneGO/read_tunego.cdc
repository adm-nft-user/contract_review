import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import TuneGO from "../../contracts/TuneGO.cdc"

// This script returns NFT data in an account's collection.

pub fun main(address: Address, collectibleId: UInt64): &TuneGO.NFT {

    // get the public account object for the token owner
    let owner = getAccount(address)

    let collectionBorrow = owner.getCapability(TuneGO.CollectionPublicPath)!
        .borrow<&{TuneGO.TuneGOCollectionPublic}>()
        ?? panic("Could not borrow capability from public collection")

    // borrow a reference to a specific NFT in the collection
    let tuneGO = collectionBorrow.borrowCollectible(id: collectibleId)
        ?? panic("No such collectibleId in that collection")

    return tuneGO
}
