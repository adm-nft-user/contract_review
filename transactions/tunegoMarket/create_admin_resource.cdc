import TuneGOMarket from "../../contracts/TuneGOMarket.cdc"

transaction() {

    prepare(admin: AuthAccount, newAdmin: AuthAccount) {

        let adminRef = admin.borrow<&TuneGOMarket.Admin>(from: TuneGOMarket.AdminStoragePath)
            ?? panic("Could not borrow a reference to the admin")

        let newAdminResource <- adminRef.createNewAdmin()

        newAdmin.save(<- newAdminResource, to: TuneGOMarket.AdminStoragePath)
    }
}
