import FungibleToken from "../../contracts/FungibleToken.cdc"
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import FlowToken from "../../contracts/FlowToken.cdc"
import TunegoNfts from "../../contracts/TunegoNfts.cdc"
import TuneGO from "../../contracts/TuneGO.cdc"
import TicalUniverse from "../../contracts/TicalUniverse.cdc"
import TunegoMarket from "../../contracts/TunegoMarket.cdc"

pub fun getOrCreateNftsProviderCapability(account: AuthAccount, contractName: String): Capability<&{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}> {
    switch contractName {
        case "TunegoNfts":
            let tunegoNftsCollectionProviderPrivatePath = /private/tunegoNftsCollectionProvider
            if !account.getCapability<&TunegoNfts.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(tunegoNftsCollectionProviderPrivatePath)!.check() {
                account.link<&TunegoNfts.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(tunegoNftsCollectionProviderPrivatePath, target: TunegoNfts.CollectionStoragePath)
            }
            return account.getCapability<&TunegoNfts.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(tunegoNftsCollectionProviderPrivatePath)!
        case "TuneGO":
            let tuneGOCollectionProviderPrivatePath = /private/tuneGOCollectionProvider
            if !account.getCapability<&TuneGO.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(tuneGOCollectionProviderPrivatePath)!.check() {
                account.link<&TuneGO.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(tuneGOCollectionProviderPrivatePath, target: TuneGO.CollectionStoragePath)
            }
            return account.getCapability<&TuneGO.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(tuneGOCollectionProviderPrivatePath)!
        case "TicalUniverse":
            let ticalUniverseCollectionProviderPrivatePath = /private/ticalUniverseCollectionProvider
            if !account.getCapability<&TicalUniverse.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(ticalUniverseCollectionProviderPrivatePath).check()! {
                account.link<&TicalUniverse.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(ticalUniverseCollectionProviderPrivatePath, target: TicalUniverse.CollectionStoragePath)
            }
            return account.getCapability<&TicalUniverse.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(ticalUniverseCollectionProviderPrivatePath)!
    }
    panic("Contract not supported")
}

pub fun setupMarketCollection(account: AuthAccount) {
    if account.borrow<&TunegoMarket.Collection>(from: TunegoMarket.CollectionStoragePath) == nil {
        let collection <- TunegoMarket.createEmptyCollection() as! @TunegoMarket.Collection
        account.save(<-collection, to: TunegoMarket.CollectionStoragePath)
        account.link<&TunegoMarket.Collection{TunegoMarket.CollectionPublic}>(TunegoMarket.CollectionPublicPath, target: TunegoMarket.CollectionStoragePath)
    }
}

transaction(collectibleContractName: String, collectibleId: UInt64, price: UFix64, royalties: {Address:UFix64}) {

    let paymentReceiver: Capability<&FlowToken.Vault{FungibleToken.Receiver}>
    let royalties: [TunegoMarket.Royalty]
    let nftsProviderCapability: Capability<&{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>
    let marketCollection: &TunegoMarket.Collection
    let collectibleType: Type

    prepare(signer: AuthAccount) {

        assert(["TunegoNfts", "TuneGO", "TicalUniverse"].contains(collectibleContractName), message: "Contract not supported")

        self.paymentReceiver = signer.getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
        assert(self.paymentReceiver.borrow() != nil, message: "Missing payment receiver vault")

        self.royalties = []

        var totalRoyaltiesPercentage: UFix64 = 0.0
        for receiver in royalties.keys {
            let account = getAccount(receiver)
            let percentage = royalties[receiver]!
            let vault = account.getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver);

            assert(vault.borrow() != nil, message: "Missing royalty receiver vault")

            self.royalties.append(TunegoMarket.Royalty(
                receiver: receiver,
                percentage: royalties[receiver]!
            ))
            totalRoyaltiesPercentage = totalRoyaltiesPercentage + percentage;
        }
        assert(totalRoyaltiesPercentage <= 95.0, message: "Total royalties percentage is too high")

        self.nftsProviderCapability = getOrCreateNftsProviderCapability(account: signer, contractName: collectibleContractName)
        assert(self.nftsProviderCapability.borrow() != nil, message: "Missing nfts provider")

        let saleItemProvider = self.nftsProviderCapability.borrow()
        let collectible = saleItemProvider!.borrowNFT(id: collectibleId)
        self.collectibleType = collectible.getType()

        setupMarketCollection(account: signer)
        self.marketCollection = signer.borrow<&TunegoMarket.Collection>(from: TunegoMarket.CollectionStoragePath)
            ?? panic("Missing TunegoMarket Collection")
    }

    execute {
        self.marketCollection.createSaleOffer(
            saleItemProviderCapability: self.nftsProviderCapability,
            collectibleType: self.collectibleType,
            collectibleId: collectibleId,
            royalties: self.royalties,
            price: price,
            paymentReceiver: self.paymentReceiver
        )
    }
}
