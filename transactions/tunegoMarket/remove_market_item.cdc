import TunegoMarket from "../../contracts/TunegoMarket.cdc"

transaction(saleOfferId: UInt64) {
    let marketCollection: &TunegoMarket.Collection

    prepare(signer: AuthAccount) {
        self.marketCollection = signer.borrow<&TunegoMarket.Collection>(from: TunegoMarket.CollectionStoragePath)
            ?? panic("Missing TunegoMarket Collection")
    }

    execute {
        self.marketCollection.removeSaleOffer(saleOfferId: saleOfferId)
    }
}
