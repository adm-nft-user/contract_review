import TuneGONFT from "../../contracts/TuneGONFT.cdc"

transaction() {

    prepare(admin: AuthAccount, newAdmin: AuthAccount) {

        let minter <- admin.load<@TuneGONFT.NFTMinter>(from: TuneGONFT.MinterStoragePath)
            ?? panic("No minter in storage")

        newAdmin.save(<-minter, to: TuneGONFT.MinterStoragePath)
    }
}
