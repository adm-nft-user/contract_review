import TunegoMarket from "../../contracts/TunegoMarket.cdc"

transaction() {

    prepare(admin: AuthAccount, newAdmin: AuthAccount) {

        let adminResource <- admin.load<@TunegoMarket.Admin>(from: TunegoMarket.AdminStoragePath)
            ?? panic("No admin in storage")

        newAdmin.save(<- adminResource, to: TunegoMarket.AdminStoragePath)
    }
}
