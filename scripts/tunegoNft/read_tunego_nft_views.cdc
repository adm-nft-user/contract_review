import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import MetadataViews from "../../contracts/MetadataViews.cdc"
import TunegoNfts from "../../contracts/TunegoNfts.cdc"

pub struct NftViews {
    pub let metadata: TunegoNfts.Metadata
    pub let edition: TunegoNfts.Edition
    pub let royalties: [TunegoNfts.Royalty]
    pub let display: MetadataViews.Display

    init(
        metadata: TunegoNfts.Metadata,
        edition: TunegoNfts.Edition,
        royalties: [TunegoNfts.Royalty],
        display: MetadataViews.Display,
    ) {
        self.metadata = metadata
        self.edition = edition
        self.royalties = royalties
        self.display = display
    }
}

pub fun main(address: Address, collectibleID: UInt64): NftViews {

    let owner = getAccount(address)
    let collectionBorrow = owner.getCapability(TunegoNfts.CollectionPublicPath)!
        .borrow<&{TunegoNfts.TunegoNftsCollectionPublic}>()
        ?? panic("Could not borrow TunegoNftsCollectionPublic")

    let tunegoNft = collectionBorrow.borrowTunegoNft(id: collectibleID)
        ?? panic("No such collectibleID in that collection")

    let metadataView = tunegoNft.resolveView(Type<TunegoNfts.Metadata>())!
    let editionView = tunegoNft.resolveView(Type<TunegoNfts.Edition>())!
    let royaltiesView = tunegoNft.resolveView(Type<[TunegoNfts.Royalty]>())!
    let displayView = tunegoNft.resolveView(Type<MetadataViews.Display>())!

    let metadata = metadataView as! TunegoNfts.Metadata
    let edition = editionView as! TunegoNfts.Edition
    let royalties = royaltiesView as! [TunegoNfts.Royalty]
    let display = displayView as! MetadataViews.Display

    return NftViews(
        metadata: metadata,
        edition: edition,
        royalties: royalties,
        display: display,
    )
}
