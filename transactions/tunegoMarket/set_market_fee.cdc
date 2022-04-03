import TuneGOMarket from "../../contracts/TuneGOMarket.cdc"

transaction(receiver: Address, percentage: UFix64) {
    let adminRef: &TuneGOMarket.Admin

    prepare(admin: AuthAccount) {

        self.adminRef = admin.borrow<&TuneGOMarket.Admin>(from: TuneGOMarket.AdminStoragePath)
            ?? panic("Could not borrow a reference to the admin")
    }

    execute {
        let tunegoMarketFee = TuneGOMarket.MarketFee(
            receiver: receiver,
            percentage: percentage
        )
        self.adminRef.setTuneGOFee(tunegoFee: tunegoMarketFee)
    }
}
