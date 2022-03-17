import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import TicalUniverse from "../../contracts/TicalUniverse.cdc"

pub fun main(address: Address): Int {
    let account = getAccount(address)

    let collectionRef = account.getCapability(TicalUniverse.CollectionPublicPath)!
        .borrow<&{NonFungibleToken.CollectionPublic}>()
        ?? panic("Could not borrow capability from public collection")
    
    return collectionRef.getIDs().length
}
