import TunegoNfts from "../../contracts/TunegoNfts.cdc"

transaction() {

    prepare(admin: AuthAccount, newAdmin: AuthAccount) {

        let minterRef = admin.borrow<&TunegoNfts.NFTMinter>(from: TunegoNfts.MinterStoragePath)
            ?? panic("Could not borrow a reference to the NFT minter")

        let newMinter <- minterRef.createNFTMinter()

        newAdmin.save(<- newMinter, to: TunegoNfts.MinterStoragePath)
    }
}
