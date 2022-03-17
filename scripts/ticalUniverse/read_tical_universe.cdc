import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import TicalUniverse from "../../contracts/TicalUniverse.cdc"

// This script returns NFT data in an account's collection.

pub fun main(address: Address, collectibleId: UInt64): &TicalUniverse.NFT {

    // get the public account object for the token owner
    let owner = getAccount(address)

    let collectionBorrow = owner.getCapability(TicalUniverse.CollectionPublicPath)!
        .borrow<&{TicalUniverse.TicalUniverseCollectionPublic}>()
        ?? panic("Could not borrow capability from public collection")

    // borrow a reference to a specific NFT in the collection
    let ticalUniverse = collectionBorrow.borrowCollectible(id: collectibleId)
        ?? panic("No such collectibleId in that collection")

    return ticalUniverse
}
