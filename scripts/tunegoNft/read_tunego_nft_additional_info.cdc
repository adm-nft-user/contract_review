import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import TunegoNfts from "../../contracts/TunegoNfts.cdc"

pub fun main(address: Address, collectibleID: UInt64): {String: String} {

    let owner = getAccount(address)
    let collectionBorrow = owner.getCapability(TunegoNfts.CollectionPublicPath)!
        .borrow<&{TunegoNfts.TunegoNftsCollectionPublic}>()
        ?? panic("Could not borrow TunegoNftsCollectionPublic")

    let tunegoNft = collectionBorrow.borrowTunegoNft(id: collectibleID)
        ?? panic("No such collectibleID in that collection")

    return tunegoNft.getAdditionalInfo()
}
