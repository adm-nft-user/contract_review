import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import TuneGONFT from "../../contracts/TuneGONFT.cdc"

pub fun main(address: Address, collectibleID: UInt64): {String: String} {

    let owner = getAccount(address)
    let collectionBorrow = owner.getCapability(TuneGONFT.CollectionPublicPath)!
        .borrow<&{TuneGONFT.TuneGONFTCollectionPublic}>()
        ?? panic("Could not borrow TuneGONFTCollectionPublic")

    let tunegoNFT = collectionBorrow.borrowTuneGONFT(id: collectibleID)
        ?? panic("No such collectibleID in that collection")

    return tunegoNFT.getAdditionalInfo()
}
