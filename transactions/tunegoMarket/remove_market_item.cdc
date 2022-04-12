import TuneGOMarket from "../../contracts/TuneGOMarket.cdc"

transaction(saleOfferId: UInt64) {
    let marketCollection: &TuneGOMarket.Collection

    prepare(signer: AuthAccount) {
        self.marketCollection = signer.borrow<&TuneGOMarket.Collection>(from: TuneGOMarket.CollectionStoragePath)
            ?? panic("Missing TuneGOMarket Collection")
    }

    execute {
        self.marketCollection.removeSaleOffer(saleOfferId: saleOfferId)
    }
}
