import TunegoMarket from "../../contracts/TunegoMarket.cdc"

transaction(receiver: Address, percentage: UFix64) {
    let adminRef: &TunegoMarket.Admin

    prepare(admin: AuthAccount) {

        self.adminRef = admin.borrow<&TunegoMarket.Admin>(from: TunegoMarket.AdminStoragePath)
            ?? panic("Could not borrow a reference to the admin")
    }

    execute {
        let tunegoMarketFee = TunegoMarket.MarketFee(
            receiver: receiver,
            percentage: percentage
        )
        self.adminRef.setTunegoFee(tunegoFee: tunegoMarketFee)
    }
}
