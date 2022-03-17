import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import TunegoNfts from "../../contracts/TunegoNfts.cdc"

// This script returns the size of an account's TunegoNfts collection.

pub fun main(address: Address): Int {
    let account = getAccount(address)

    let collectionRef = account.getCapability(TunegoNfts.CollectionPublicPath)!
        .borrow<&{NonFungibleToken.CollectionPublic}>()
        ?? panic("Could not borrow capability from public collection")
    
    return collectionRef.getIDs().length
}
