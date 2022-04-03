import TuneGOMarket from "../../contracts/TuneGOMarket.cdc"
import TuneGONFT from "../../contracts/TuneGONFT.cdc"

transaction() {
    let adminRef: &TuneGOMarket.Admin

    prepare(admin: AuthAccount) {

        self.adminRef = admin.borrow<&TuneGOMarket.Admin>(from: TuneGOMarket.AdminStoragePath)
            ?? panic("Could not borrow a reference to the admin")
    }

    execute {
        self.adminRef.addSupportedNFTType(nftType: Type<@TuneGONFT.NFT>())
    }
}
