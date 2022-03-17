import FungibleToken from "../../contracts/FungibleToken.cdc"
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import FlowToken from "../../contracts/FlowToken.cdc"
import TunegoNfts from "../../contracts/TunegoNfts.cdc"
import TuneGO from "../../contracts/TuneGO.cdc"
import TicalUniverse from "../../contracts/TicalUniverse.cdc"
import TunegoMarket from "../../contracts/TunegoMarket.cdc"

pub fun getOrCreateNftsCollectionRef(account: AuthAccount, contractName: String): &{NonFungibleToken.Receiver} {
    switch contractName {
        case "TunegoNfts":
            if let existingCollectionRef = account.borrow<&TunegoNfts.Collection>(from: TunegoNfts.CollectionStoragePath) {
                return existingCollectionRef
            }
            let collection <- TunegoNfts.createEmptyCollection() as! @TunegoNfts.Collection
            let collectionRef = &collection as &TunegoNfts.Collection
    
            account.save(<-collection, to: TunegoNfts.CollectionStoragePath)
            account.link<&TunegoNfts.Collection{NonFungibleToken.CollectionPublic, TunegoNfts.TunegoNftsCollectionPublic}>(TunegoNfts.CollectionPublicPath, target: TunegoNfts.CollectionStoragePath)

            return collectionRef
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

pub fun getNftsCollectionCapability(account: AuthAccount, contractName: String): Capability<&{NonFungibleToken.Receiver}> {
    switch contractName {
        case "TunegoNfts":
            return  account.getCapability<&TunegoNfts.Collection{NonFungibleToken.Receiver}>(TunegoNfts.CollectionPublicPath)
        case "TuneGO":
            return  account.getCapability<&TuneGO.Collection{NonFungibleToken.Receiver}>(TuneGO.CollectionPublicPath)
        case "TicalUniverse":
            return  account.getCapability<&TicalUniverse.Collection{NonFungibleToken.Receiver}>(TicalUniverse.CollectionPublicPath)
    }
    panic("Contract not supported")
}

transaction(collectibleContractName: String, saleOfferId: UInt64, marketCollectionAddress: Address) {

    let paymentVault: @FungibleToken.Vault
    let nftsReceiver: &{NonFungibleToken.Receiver}
    let nftsCollactionCapability: Capability<&{NonFungibleToken.Receiver}>
    let saleOffer: &TunegoMarket.SaleOffer{TunegoMarket.SaleOfferPublic}

    prepare(signer: AuthAccount) {

        assert(["TunegoNfts", "TuneGO", "TicalUniverse"].contains(collectibleContractName), message: "Contract not supported")

        let marketCollection = getAccount(marketCollectionAddress)
            .getCapability<&TunegoMarket.Collection{TunegoMarket.CollectionPublic}>(
                TunegoMarket.CollectionPublicPath
            )
            .borrow()
            ?? panic("Could not borrow market collection from market address")

        self.saleOffer = marketCollection.borrowSaleOffer(saleOfferId: saleOfferId)
            ?? panic("Sale offer with provided id not found in market collection")

        let price = self.saleOffer.price
        let buyerVault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Cannot borrow FlowToken vault from buyer storage")

        self.paymentVault <- buyerVault.withdraw(amount: price)
        self.nftsReceiver = getOrCreateNftsCollectionRef(account: signer, contractName: collectibleContractName)
        self.nftsCollactionCapability = getNftsCollectionCapability(account: signer, contractName: collectibleContractName)
    }

    execute {
        let collectible <- self.saleOffer.purchase(payment: <- self.paymentVault, buyerCollection: self.nftsCollactionCapability)

        self.nftsReceiver.deposit(token: <-collectible)
    }
}