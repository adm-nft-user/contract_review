import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import FungibleToken from "../../contracts/FungibleToken.cdc"
import FlowToken from "../../contracts/FlowToken.cdc"
import TunegoNfts from "../../contracts/TunegoNfts.cdc"

transaction(
    recipient: Address,
    itemId: String,
    collectionId: String,
    title: String,
    description: String,
    rarity: String,
    creator: String,
    credits: String,
    asset: String,
    royalties: {Address:UFix64},
    additionalInfo: {String: String},
    quantity: UInt64
) {
    let minter: &TunegoNfts.NFTMinter
    let royalties: [TunegoNfts.Royalty]

    prepare(signer: AuthAccount) {

        self.minter = signer.borrow<&TunegoNfts.NFTMinter>(from: TunegoNfts.MinterStoragePath)
            ?? panic("Could not borrow a reference to the NFT minter")

        self.royalties = []

        var totalRoyaltiesPercentage: UFix64 = 0.0
        for receiver in royalties.keys {
            let account = getAccount(receiver)
            let percentage = royalties[receiver]!
            let vault = account.getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver);

            assert(vault.borrow() != nil, message: "Missing royalty receiver vault")

            self.royalties.append(TunegoNfts.Royalty(
                receiver: receiver,
                percentage: royalties[receiver]!
            ))
            totalRoyaltiesPercentage = totalRoyaltiesPercentage + percentage;
        }
        assert(totalRoyaltiesPercentage <= 95.0, message: "Total royalties percentage is too high")
    }

    execute {
        let recipient = getAccount(recipient)
        let recipientRef = recipient
            .getCapability(TunegoNfts.CollectionPublicPath)
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not get recipient reference to the NFT Collection")

        let metadata = TunegoNfts.Metadata(
            title: title,
            description: description,
            rarity: rarity,
            creator: creator,
            credits: credits,
            asset: asset
        )

        self.minter.batchMintNFT(
            recipient: recipientRef,
            itemId: itemId,
            collectionId: collectionId,
            metadata: metadata,
            royalties: self.royalties,
            additionalInfo: additionalInfo,
            quantity: quantity
        )
    }
}
