import FungibleToken from "../../contracts/FungibleToken.cdc"
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import FlowToken from "../../contracts/FlowToken.cdc"
import TuneGO from "../../contracts/TuneGO.cdc"
import TicalUniverse from "../../contracts/TicalUniverse.cdc"
import TuneGOMarket from "../../contracts/TuneGOMarket.cdc"

pub fun getOrCreateNFTProviderCapability(account: AuthAccount, contractName: String): Capability<&{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}> {
    switch contractName {
        case "TuneGO":
            let tunegoCollectionProviderPrivatePath = /private/tunegoCollectionProvider
            if !account.getCapability<&TuneGO.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(tunegoCollectionProviderPrivatePath)!.check() {
                account.link<&TuneGO.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(tunegoCollectionProviderPrivatePath, target: TuneGO.CollectionStoragePath)
            }
            return account.getCapability<&TuneGO.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(tunegoCollectionProviderPrivatePath)!
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
    if account.borrow<&TuneGOMarket.Collection>(from: TuneGOMarket.CollectionStoragePath) == nil {
        let collection <- TuneGOMarket.createEmptyCollection() as! @TuneGOMarket.Collection
        account.save(<-collection, to: TuneGOMarket.CollectionStoragePath)
        account.link<&TuneGOMarket.Collection{TuneGOMarket.CollectionPublic}>(TuneGOMarket.CollectionPublicPath, target: TuneGOMarket.CollectionStoragePath)
    }
}

transaction(collectibleContractName: String, collectibleId: UInt64, price: UFix64, royalties: {Address:UFix64}) {

    let paymentReceiver: Capability<&FlowToken.Vault{FungibleToken.Receiver}>
    let royalties: [TuneGOMarket.Royalty]
    let nftProviderCapability: Capability<&{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>
    let marketCollection: &TuneGOMarket.Collection
    let collectibleType: Type

    prepare(signer: AuthAccount) {

        assert(["TuneGO", "TicalUniverse"].contains(collectibleContractName), message: "Contract not supported")

        self.paymentReceiver = signer.getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
        assert(self.paymentReceiver.borrow() != nil, message: "Missing payment receiver vault")

        self.royalties = []

        var totalRoyaltiesPercentage: UFix64 = 0.0
        for receiver in royalties.keys {
            let account = getAccount(receiver)
            let percentage = royalties[receiver]!
            let vault = account.getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver);

            assert(vault.borrow() != nil, message: "Missing royalty receiver vault")

            self.royalties.append(TuneGOMarket.Royalty(
                receiver: receiver,
                percentage: royalties[receiver]!
            ))
            totalRoyaltiesPercentage = totalRoyaltiesPercentage + percentage;
        }
        assert(totalRoyaltiesPercentage <= 95.0, message: "Total royalties percentage is too high")

        self.nftProviderCapability = getOrCreateNFTProviderCapability(account: signer, contractName: collectibleContractName)
        assert(self.nftProviderCapability.borrow() != nil, message: "Missing nft provider")

        let saleItemProvider = self.nftProviderCapability.borrow()
        let collectible = saleItemProvider!.borrowNFT(id: collectibleId)
        self.collectibleType = collectible.getType()

        setupMarketCollection(account: signer)
        self.marketCollection = signer.borrow<&TuneGOMarket.Collection>(from: TuneGOMarket.CollectionStoragePath)
            ?? panic("Missing TuneGOMarket Collection")
    }

    execute {
        self.marketCollection.createSaleOffer(
            saleItemProviderCapability: self.nftProviderCapability,
            collectibleType: self.collectibleType,
            collectibleId: collectibleId,
            royalties: self.royalties,
            price: price,
            paymentReceiver: self.paymentReceiver
        )
    }
}
