import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import MetadataViews from "../../contracts/MetadataViews.cdc"
import TuneGONFT from "../../contracts/TuneGONFT.cdc"

pub struct NFTViews {
    pub let metadata: TuneGONFT.Metadata
    pub let edition: TuneGONFT.Edition
    pub let royalties: [TuneGONFT.Royalty]
    pub let display: MetadataViews.Display

    init(
        metadata: TuneGONFT.Metadata,
        edition: TuneGONFT.Edition,
        royalties: [TuneGONFT.Royalty],
        display: MetadataViews.Display,
    ) {
        self.metadata = metadata
        self.edition = edition
        self.royalties = royalties
        self.display = display
    }
}

pub fun main(address: Address, collectibleID: UInt64): NFTViews {

    let owner = getAccount(address)
    let collectionBorrow = owner.getCapability(TuneGONFT.CollectionPublicPath)!
        .borrow<&{TuneGONFT.TuneGONFTCollectionPublic}>()
        ?? panic("Could not borrow TuneGONFTCollectionPublic")

    let tunegoNFT = collectionBorrow.borrowTuneGONFT(id: collectibleID)
        ?? panic("No such collectibleID in that collection")

    let metadataView = tunegoNFT.resolveView(Type<TuneGONFT.Metadata>())!
    let editionView = tunegoNFT.resolveView(Type<TuneGONFT.Edition>())!
    let royaltiesView = tunegoNFT.resolveView(Type<[TuneGONFT.Royalty]>())!
    let displayView = tunegoNFT.resolveView(Type<MetadataViews.Display>())!

    let metadata = metadataView as! TuneGONFT.Metadata
    let edition = editionView as! TuneGONFT.Edition
    let royalties = royaltiesView as! [TuneGONFT.Royalty]
    let display = displayView as! MetadataViews.Display

    return NFTViews(
        metadata: metadata,
        edition: edition,
        royalties: royalties,
        display: display,
    )
}
