import FungibleToken from "../../contracts/FungibleToken.cdc"
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import FlowToken from "../../contracts/FlowToken.cdc"
import TuneGO from "../../contracts/TuneGO.cdc"
import TicalUniverse from "../../contracts/TicalUniverse.cdc"
import TuneGOMarket from "../../contracts/TuneGOMarket.cdc"

pub fun getOrCreateNFTCollectionRef(account: AuthAccount, contractName: String): &{NonFungibleToken.Receiver} {
    switch contractName {
        case "TuneGO":
            if let existingCollectionRef = account.borrow<&TuneGO.Collection>(from: TuneGO.CollectionStoragePath) {
                return existingCollectionRef
            }
            let collection <- TuneGO.createEmptyCollection() as! @TuneGO.Collection
            let collectionRef = &collection as &TuneGO.Collection
    
            account.save(<-collection, to: TuneGO.CollectionStoragePath)
            account.link<&TuneGO.Collection{NonFungibleToken.CollectionPublic, TuneGO.TuneGOCollectionPublic}>(TuneGO.CollectionPublicPath, target: TuneGO.CollectionStoragePath)

            return collectionRef
        case "TicalUniverse":
            if let existingCollectionRef = account.borrow<&TicalUniverse.Collection>(from: TicalUniverse.CollectionStoragePath) {
                return existingCollectionRef
            }
            let collection <- TicalUniverse.createEmptyCollection() as! @TicalUniverse.Collection
            let collectionRef = &collection as &TicalUniverse.Collection
    
            account.save(<-collection, to: TicalUniverse.CollectionStoragePath)
            account.link<&TicalUniverse.Collection{NonFungibleToken.CollectionPublic, TicalUniverse.TicalUniverseCollectionPublic}>(TicalUniverse.CollectionPublicPath, target: TicalUniverse.CollectionStoragePath)

            return collectionRef
    }
    panic("Contract not supported")
}

pub fun getNFTCollectionCapability(account: AuthAccount, contractName: String): Capability<&{NonFungibleToken.Receiver}> {
    switch contractName {
        case "TuneGO":
            return  account.getCapability<&TuneGO.Collection{NonFungibleToken.Receiver}>(TuneGO.CollectionPublicPath)
        case "TicalUniverse":
            return  account.getCapability<&TicalUniverse.Collection{NonFungibleToken.Receiver}>(TicalUniverse.CollectionPublicPath)
    }
    panic("Contract not supported")
}

transaction(collectibleContractName: String, saleOfferId: UInt64, marketCollectionAddress: Address) {

    let paymentVault: @FungibleToken.Vault
    let nftReceiver: &{NonFungibleToken.Receiver}
    let nftCollactionCapability: Capability<&{NonFungibleToken.Receiver}>
    let saleOffer: &TuneGOMarket.SaleOffer{TuneGOMarket.SaleOfferPublic}

    prepare(signer: AuthAccount) {

        assert(["TuneGO", "TicalUniverse"].contains(collectibleContractName), message: "Contract not supported")

        let marketCollection = getAccount(marketCollectionAddress)
            .getCapability<&TuneGOMarket.Collection{TuneGOMarket.CollectionPublic}>(
                TuneGOMarket.CollectionPublicPath
            )
            .borrow()
            ?? panic("Could not borrow market collection from market address")

        self.saleOffer = marketCollection.borrowSaleOffer(saleOfferId: saleOfferId)
            ?? panic("Sale offer with provided id not found in market collection")

        let price = self.saleOffer.price
        let buyerVault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Cannot borrow FlowToken vault from buyer storage")

        self.paymentVault <- buyerVault.withdraw(amount: price)
        self.nftReceiver = getOrCreateNFTCollectionRef(account: signer, contractName: collectibleContractName)
        self.nftCollactionCapability = getNFTCollectionCapability(account: signer, contractName: collectibleContractName)
    }

    execute {
        let collectible <- self.saleOffer.purchase(payment: <- self.paymentVault, buyerCollection: self.nftCollactionCapability)

        self.nftReceiver.deposit(token: <-collectible)
    }
}