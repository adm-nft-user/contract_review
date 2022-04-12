import TuneGOMarket from "../../contracts/TuneGOMarket.cdc"

transaction() {

    prepare(admin: AuthAccount, newAdmin: AuthAccount) {

        let adminResource <- admin.load<@TuneGOMarket.Admin>(from: TuneGOMarket.AdminStoragePath)
            ?? panic("No admin in storage")

        newAdmin.save(<- adminResource, to: TuneGOMarket.AdminStoragePath)
    }
}
