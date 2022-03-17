import TunegoNfts from "../../contracts/TunegoNfts.cdc"

transaction() {

    prepare(admin: AuthAccount, newAdmin: AuthAccount) {

        let minter <- admin.load<@TunegoNfts.NFTMinter>(from: TunegoNfts.MinterStoragePath)
            ?? panic("No minter in storage")

        newAdmin.save(<-minter, to: TunegoNfts.MinterStoragePath)
    }
}
