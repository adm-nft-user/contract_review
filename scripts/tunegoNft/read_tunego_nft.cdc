import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import TunegoNfts from "../../contracts/TunegoNfts.cdc"

// This script returns the metadata for an NFT in an account's collection.

pub fun main(address: Address, collectibleId: UInt64): &TunegoNfts.NFT {

    // get the public account object for the token owner
    let owner = getAccount(address)

    let collectionBorrow = owner.getCapability(TunegoNfts.CollectionPublicPath)!
        .borrow<&{TunegoNfts.TunegoNftsCollectionPublic}>()
        ?? panic("Could not borrow TunegoNftsCollectionPublic")

    // borrow a reference to a specific NFT in the collection
    let tunegoNft = collectionBorrow.borrowTunegoNft(id: collectibleId)
        ?? panic("No such collectibleId in that collection")

    return tunegoNft
}
