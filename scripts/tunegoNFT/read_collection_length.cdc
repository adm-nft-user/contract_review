import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import TuneGONFT from "../../contracts/TuneGONFT.cdc"

// This script returns the size of an account's TuneGONFT collection.

pub fun main(address: Address): Int {
    let account = getAccount(address)

    let collectionRef = account.getCapability(TuneGONFT.CollectionPublicPath)!
        .borrow<&{NonFungibleToken.CollectionPublic}>()
        ?? panic("Could not borrow capability from public collection")
    
    return collectionRef.getIDs().length
}
