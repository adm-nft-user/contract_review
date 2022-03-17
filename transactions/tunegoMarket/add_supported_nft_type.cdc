import TunegoMarket from "../../contracts/TunegoMarket.cdc"
import TunegoNfts from "../../contracts/TunegoNfts.cdc"

transaction() {
    let adminRef: &TunegoMarket.Admin

    prepare(admin: AuthAccount) {

        self.adminRef = admin.borrow<&TunegoMarket.Admin>(from: TunegoMarket.AdminStoragePath)
            ?? panic("Could not borrow a reference to the admin")
    }

    execute {
        self.adminRef.addSupportedNftType(nftType: Type<@TunegoNfts.NFT>())
    }
}
