import TuneGONFT from "../../contracts/TuneGONFT.cdc"

transaction() {

    prepare(admin: AuthAccount, newAdmin: AuthAccount) {

        let minterRef = admin.borrow<&TuneGONFT.NFTMinter>(from: TuneGONFT.MinterStoragePath)
            ?? panic("Could not borrow a reference to the NFT minter")

        let newMinter <- minterRef.createNFTMinter()

        newAdmin.save(<- newMinter, to: TuneGONFT.MinterStoragePath)
    }
}
