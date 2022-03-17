import TunegoMarket from "../../contracts/TunegoMarket.cdc"

transaction() {

    prepare(admin: AuthAccount, newAdmin: AuthAccount) {

        let adminRef = admin.borrow<&TunegoMarket.Admin>(from: TunegoMarket.AdminStoragePath)
            ?? panic("Could not borrow a reference to the admin")

        let newAdminResource <- adminRef.createNewAdmin()

        newAdmin.save(<- newAdminResource, to: TunegoMarket.AdminStoragePath)
    }
}
